-- =====================================================================
-- 16_sp_consultas_visitas.sql - Consultas de contacto y visitas (P4, P9, HU6)
-- DISENO_BACKEND 4.7. Idempotente (CREATE OR REPLACE). Sin SET search_path.
-- Plazos (P4): clasificar en 2 dias habiles, responder en 5 dias habiles.
-- =====================================================================

-- ---------------------------------------------------------------------
-- sp_consulta_registrar: publica, sin actor. -> id_consulta (recibida)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_consulta_registrar(p_nombre TEXT, p_correo TEXT, p_asunto TEXT, p_mensaje TEXT)
RETURNS INT
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
AS $$
DECLARE
    v_id INT;
BEGIN
    IF char_length(btrim(COALESCE(p_nombre, ''))) = 0 OR char_length(p_nombre) > 150 THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'El nombre es obligatorio (máximo 150 caracteres)', DETAIL = 'nombre';
    END IF;
    IF p_correo IS NULL OR char_length(p_correo) > 150 OR btrim(p_correo) !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'El correo no es válido', DETAIL = 'correo';
    END IF;
    IF char_length(COALESCE(p_asunto, '')) > 150 THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'El asunto no puede superar 150 caracteres', DETAIL = 'asunto';
    END IF;
    IF char_length(btrim(COALESCE(p_mensaje, ''))) = 0 OR char_length(p_mensaje) > 5000 THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'El mensaje es obligatorio (máximo 5000 caracteres)', DETAIL = 'mensaje';
    END IF;

    INSERT INTO consulta_contacto (nombre_visitante, correo_visitante, asunto, mensaje, estado, fecha_recepcion)
    VALUES (btrim(p_nombre), btrim(p_correo), NULLIF(btrim(COALESCE(p_asunto, '')), ''), btrim(p_mensaje),
            'recibida', now())
    RETURNING id_consulta INTO v_id;
    RETURN v_id;
END;
$$;

-- ---------------------------------------------------------------------
-- sp_consulta_clasificar: recibida -> en_atencion | derivada | descartada. -> estado nuevo
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_consulta_clasificar(
    p_id_editor INT, p_id INT, p_destino TEXT, p_id_departamento INT, p_nota TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
AS $$
DECLARE
    v_estado TEXT;
    v_nuevo  TEXT;
    v_nota   TEXT := NULLIF(btrim(COALESCE(p_nota, '')), '');
BEGIN
    SELECT estado::text INTO v_estado FROM consulta_contacto WHERE id_consulta = p_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION USING ERRCODE = 'RN404', MESSAGE = 'Consulta no encontrada';
    END IF;

    PERFORM sp_rev_assert_rol(p_id_editor, ARRAY['Editor', 'Revisor']);
    IF p_destino IS NULL OR p_destino NOT IN ('area', 'externa', 'descartar') THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'El destino debe ser area, externa o descartar', DETAIL = 'destino';
    END IF;
    IF v_estado <> 'recibida' THEN
        RAISE EXCEPTION USING ERRCODE = 'RN409',
            MESSAGE = format('Acción no permitida en estado %s', v_estado), DETAIL = 'estado';
    END IF;

    IF p_destino = 'area' THEN
        IF p_id_departamento IS NULL OR NOT EXISTS (SELECT 1 FROM departamento WHERE id_departamento = p_id_departamento) THEN
            RAISE EXCEPTION USING ERRCODE = 'RN422',
                MESSAGE = 'Indique el departamento responsable', DETAIL = 'id_departamento_responsable';
        END IF;
        UPDATE consulta_contacto
           SET estado = 'en_atencion', id_departamento_responsable = p_id_departamento,
               fecha_clasificacion = now(), id_editor_clasifica = p_id_editor
         WHERE id_consulta = p_id;
        v_nuevo := 'en_atencion';
    ELSIF p_destino = 'externa' THEN
        IF v_nota IS NULL THEN
            RAISE EXCEPTION USING ERRCODE = 'RN422',
                MESSAGE = 'Indique el canal adecuado al que se deriva la consulta', DETAIL = 'nota';
        END IF;
        UPDATE consulta_contacto
           SET estado = 'derivada', respuesta = v_nota, fecha_respuesta = now(),
               fecha_clasificacion = now(), id_editor_clasifica = p_id_editor
         WHERE id_consulta = p_id;
        v_nuevo := 'derivada';
    ELSE
        UPDATE consulta_contacto
           SET estado = 'descartada', fecha_clasificacion = now(), id_editor_clasifica = p_id_editor
         WHERE id_consulta = p_id;
        v_nuevo := 'descartada';
    END IF;
    RETURN v_nuevo;
END;
$$;

-- ---------------------------------------------------------------------
-- sp_consulta_responder: en_atencion -> atendida
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_consulta_responder(p_id_editor INT, p_id INT, p_respuesta TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
AS $$
DECLARE
    v_estado TEXT;
    v_len    INT := char_length(btrim(COALESCE(p_respuesta, '')));
BEGIN
    SELECT estado::text INTO v_estado FROM consulta_contacto WHERE id_consulta = p_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION USING ERRCODE = 'RN404', MESSAGE = 'Consulta no encontrada';
    END IF;

    PERFORM sp_rev_assert_rol(p_id_editor, ARRAY['Editor', 'Revisor']);
    IF v_estado <> 'en_atencion' THEN
        RAISE EXCEPTION USING ERRCODE = 'RN409',
            MESSAGE = format('Acción no permitida en estado %s', v_estado), DETAIL = 'estado';
    END IF;
    IF v_len < 10 OR v_len > 5000 THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422',
            MESSAGE = 'La respuesta debe tener entre 10 y 5000 caracteres', DETAIL = 'respuesta';
    END IF;

    UPDATE consulta_contacto SET estado = 'atendida', respuesta = btrim(p_respuesta), fecha_respuesta = now()
     WHERE id_consulta = p_id;
END;
$$;

-- ---------------------------------------------------------------------
-- sp_consulta_vencidas: fuera de plazo (recibida > 2 dh, en_atencion > 5 dh)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_consulta_vencidas()
RETURNS TABLE (id_consulta INT, estado TEXT, dias_habiles INT, plazo INT)
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
AS $$
#variable_conflict use_column
BEGIN
    RETURN QUERY
    SELECT x.id_consulta, x.estado, x.dh, x.plazo
      FROM (
        SELECT c.id_consulta, c.estado::text AS estado,
               sp_dias_habiles(c.fecha_recepcion, now()) AS dh, 2 AS plazo
          FROM consulta_contacto c WHERE c.estado = 'recibida'
        UNION ALL
        SELECT c.id_consulta, c.estado::text,
               sp_dias_habiles(COALESCE(c.fecha_clasificacion, c.fecha_recepcion), now()), 5
          FROM consulta_contacto c WHERE c.estado = 'en_atencion'
      ) x
     WHERE x.dh > x.plazo
     ORDER BY x.id_consulta;
END;
$$;

-- ---------------------------------------------------------------------
-- sp_visita_registrar: anonimo (sin IP ni identificador)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_visita_registrar(p_seccion TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
AS $$
BEGIN
    IF p_seccion IS NULL OR p_seccion NOT IN ('admision', 'plan_estudios', 'docentes', 'documentos', 'contacto') THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'Sección no válida', DETAIL = 'seccion';
    END IF;
    INSERT INTO registro_visita (seccion, fecha) VALUES (p_seccion, now());
END;
$$;

-- ---------------------------------------------------------------------
-- sp_visita_estadisticas: visitas por seccion y dia (rango inclusivo, max 366 dias)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_visita_estadisticas(p_desde DATE, p_hasta DATE)
RETURNS TABLE (seccion TEXT, dia DATE, total BIGINT)
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
AS $$
#variable_conflict use_column
BEGIN
    IF p_desde IS NULL OR p_hasta IS NULL OR p_hasta < p_desde THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'El rango de fechas no es válido', DETAIL = 'desde';
    END IF;
    IF p_hasta - p_desde + 1 > 366 THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'El rango no puede superar 366 días', DETAIL = 'hasta';
    END IF;

    RETURN QUERY
    SELECT v.seccion::text, v.fecha::date, count(*)::bigint
      FROM registro_visita v
     WHERE v.fecha >= p_desde AND v.fecha < p_hasta + 1
     GROUP BY v.seccion, v.fecha::date
     ORDER BY v.fecha::date, v.seccion;
END;
$$;
