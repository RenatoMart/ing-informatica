-- =====================================================================
-- 13_sp_docentes.sql - Procedimientos almacenados de docentes y departamentos (P3, HU3)
-- DISENO_BACKEND 2.2 y 4.4. Idempotente (CREATE OR REPLACE). Sin SET search_path.
-- cambios_pendientes (docente publicado): nombres, apellidos, grado_academico,
-- id_departamento, curso_principal, condicion_laboral, es_investigador,
-- categoria_renacyt, especialidades [texto], ruta_fotografia, encuadre_x,
-- encuadre_y, _id_editor. Solo se aplican las claves presentes.
-- =====================================================================

-- ---------------------------------------------------------------------
-- sp_departamento_guardar: p_id NULL = crear. -> id_departamento
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_departamento_guardar(
    p_id_usuario INT, p_id INT, p_nombre TEXT, p_correo TEXT)
RETURNS INT
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
AS $$
DECLARE
    v_nombre TEXT := btrim(COALESCE(p_nombre, ''));
    v_correo TEXT := NULLIF(btrim(COALESCE(p_correo, '')), '');
    v_id     INT;
BEGIN
    PERFORM sp_rev_assert_rol(p_id_usuario, ARRAY['Editor', 'Revisor']);

    IF char_length(v_nombre) = 0 OR char_length(v_nombre) > 150 THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422',
            MESSAGE = 'El nombre del departamento es obligatorio (máximo 150 caracteres)', DETAIL = 'nombre';
    END IF;
    IF v_correo IS NOT NULL AND (char_length(v_correo) > 150 OR v_correo !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$') THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'El correo no es válido', DETAIL = 'correo';
    END IF;

    IF p_id IS NULL THEN
        INSERT INTO departamento (nombre, correo) VALUES (v_nombre, v_correo)
        RETURNING id_departamento INTO v_id;
    ELSE
        UPDATE departamento SET nombre = v_nombre, correo = v_correo
         WHERE id_departamento = p_id RETURNING id_departamento INTO v_id;
        IF NOT FOUND THEN
            RAISE EXCEPTION USING ERRCODE = 'RN404', MESSAGE = 'Departamento no encontrado';
        END IF;
    END IF;
    RETURN v_id;
END;
$$;

-- ---------------------------------------------------------------------
-- Auxiliar: valida y normaliza campos de docente; devuelve las especialidades limpias.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_docente_validar_campos(
    p_nombres TEXT, p_apellidos TEXT, p_grado TEXT, p_id_departamento INT,
    p_curso_principal TEXT, p_condicion TEXT, p_es_investigador BOOLEAN,
    p_categoria_renacyt TEXT, p_especialidades TEXT[])
RETURNS TEXT[]
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
AS $$
DECLARE
    v_esp TEXT[];
    v_n   INT;
BEGIN
    IF char_length(btrim(COALESCE(p_nombres, ''))) = 0 OR char_length(p_nombres) > 100 THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'Los nombres son obligatorios (máximo 100 caracteres)', DETAIL = 'nombres';
    END IF;
    IF char_length(btrim(COALESCE(p_apellidos, ''))) = 0 OR char_length(p_apellidos) > 100 THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'Los apellidos son obligatorios (máximo 100 caracteres)', DETAIL = 'apellidos';
    END IF;
    IF char_length(COALESCE(p_grado, '')) > 100 THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'El grado académico no puede superar 100 caracteres', DETAIL = 'grado_academico';
    END IF;
    IF char_length(COALESCE(p_curso_principal, '')) > 150 THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'El curso principal no puede superar 150 caracteres', DETAIL = 'curso_principal';
    END IF;
    IF p_id_departamento IS NULL OR NOT EXISTS (SELECT 1 FROM departamento WHERE id_departamento = p_id_departamento) THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'El departamento no existe', DETAIL = 'id_departamento';
    END IF;
    IF NULLIF(btrim(COALESCE(p_condicion, '')), '') IS NOT NULL AND p_condicion NOT IN ('nombrado', 'contratado') THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'La condición laboral debe ser nombrado o contratado', DETAIL = 'condicion_laboral';
    END IF;
    IF COALESCE(p_es_investigador, FALSE) THEN
        IF char_length(btrim(COALESCE(p_categoria_renacyt, ''))) = 0 THEN
            RAISE EXCEPTION USING ERRCODE = 'RN422',
                MESSAGE = 'La categoría RENACYT es obligatoria para un docente investigador', DETAIL = 'categoria_renacyt';
        END IF;
        IF char_length(p_categoria_renacyt) > 50 THEN
            RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'La categoría RENACYT no puede superar 50 caracteres', DETAIL = 'categoria_renacyt';
        END IF;
    END IF;

    SELECT COALESCE(array_agg(DISTINCT btrim(e)), '{}') INTO v_esp
      FROM unnest(COALESCE(p_especialidades, '{}')) AS t(e) WHERE char_length(btrim(e)) > 0;
    SELECT count(*) INTO v_n FROM unnest(COALESCE(p_especialidades, '{}')) AS t(e) WHERE char_length(btrim(e)) > 0;
    IF v_n <> COALESCE(array_length(v_esp, 1), 0) THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'Las especialidades no pueden repetirse', DETAIL = 'especialidades';
    END IF;
    IF COALESCE(array_length(v_esp, 1), 0) NOT BETWEEN 1 AND 5 THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'Indique entre 1 y 5 especialidades', DETAIL = 'especialidades';
    END IF;
    IF EXISTS (SELECT 1 FROM unnest(v_esp) AS t(e) WHERE char_length(e) > 150) THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'Cada especialidad admite como máximo 150 caracteres', DETAIL = 'especialidades';
    END IF;
    RETURN v_esp;
END;
$$;

-- ---------------------------------------------------------------------
-- sp_docente_crear -> id_docente (borrador, encuadre 50/25)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_docente_crear(
    p_id_editor INT, p_nombres TEXT, p_apellidos TEXT, p_grado TEXT, p_id_departamento INT,
    p_curso_principal TEXT, p_condicion TEXT, p_es_investigador BOOLEAN,
    p_categoria_renacyt TEXT, p_especialidades TEXT[])
RETURNS INT
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
AS $$
DECLARE
    v_esp TEXT[];
    v_id  INT;
    v_inv BOOLEAN := COALESCE(p_es_investigador, FALSE);
BEGIN
    PERFORM sp_rev_assert_rol(p_id_editor, ARRAY['Editor', 'Revisor']);
    v_esp := sp_docente_validar_campos(p_nombres, p_apellidos, p_grado, p_id_departamento,
                p_curso_principal, p_condicion, v_inv, p_categoria_renacyt, p_especialidades);

    INSERT INTO docente (nombres, apellidos, grado_academico, id_departamento, curso_principal,
                         condicion_laboral, es_investigador, categoria_renacyt, encuadre_x, encuadre_y,
                         estado, fecha_registro, id_editor)
    VALUES (btrim(p_nombres), btrim(p_apellidos), NULLIF(btrim(COALESCE(p_grado, '')), ''), p_id_departamento,
            NULLIF(btrim(COALESCE(p_curso_principal, '')), ''),
            NULLIF(btrim(COALESCE(p_condicion, '')), '')::condicion_laboral,
            v_inv, CASE WHEN v_inv THEN btrim(p_categoria_renacyt) END, 50, 25,
            sp_rev_transicion('docente', NULL, NULL, 'guardar')::estado_docente, now(), p_id_editor)
    RETURNING id_docente INTO v_id;

    INSERT INTO especialidad_docente (id_docente, especialidad) SELECT v_id, e FROM unnest(v_esp) AS t(e);
    PERFORM sp_rev_registrar_historial('docente', v_id, 'guardar', NULL, 'borrador', p_id_editor, NULL);
    RETURN v_id;
END;
$$;

-- ---------------------------------------------------------------------
-- sp_docente_actualizar -> 'directo' | 'cambio_pendiente'
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_docente_actualizar(
    p_id_editor INT, p_id INT, p_nombres TEXT, p_apellidos TEXT, p_grado TEXT, p_id_departamento INT,
    p_curso_principal TEXT, p_condicion TEXT, p_es_investigador BOOLEAN,
    p_categoria_renacyt TEXT, p_especialidades TEXT[])
RETURNS TEXT
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
AS $$
DECLARE
    v_estado TEXT;
    v_op     TEXT;
    v_json   JSONB;
    v_esp    TEXT[];
    v_inv    BOOLEAN := COALESCE(p_es_investigador, FALSE);
    v_cat    TEXT;
    v_nuevo  JSONB;
    v_k      TEXT;
BEGIN
    SELECT estado::text, operacion_pendiente, cambios_pendientes
      INTO v_estado, v_op, v_json
      FROM docente WHERE id_docente = p_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION USING ERRCODE = 'RN404', MESSAGE = 'Registro no encontrado';
    END IF;

    PERFORM sp_rev_assert_rol(p_id_editor, ARRAY['Editor', 'Revisor']);
    v_esp := sp_docente_validar_campos(p_nombres, p_apellidos, p_grado, p_id_departamento,
                p_curso_principal, p_condicion, v_inv, p_categoria_renacyt, p_especialidades);
    v_cat := CASE WHEN v_inv THEN btrim(p_categoria_renacyt) END;

    IF v_estado = 'borrador' THEN
        PERFORM sp_rev_transicion('docente', v_estado, v_op, 'guardar');
        UPDATE docente
           SET nombres = btrim(p_nombres), apellidos = btrim(p_apellidos),
               grado_academico = NULLIF(btrim(COALESCE(p_grado, '')), ''),
               id_departamento = p_id_departamento,
               curso_principal = NULLIF(btrim(COALESCE(p_curso_principal, '')), ''),
               condicion_laboral = NULLIF(btrim(COALESCE(p_condicion, '')), '')::condicion_laboral,
               es_investigador = v_inv, categoria_renacyt = v_cat
         WHERE id_docente = p_id;
        DELETE FROM especialidad_docente WHERE id_docente = p_id;
        INSERT INTO especialidad_docente (id_docente, especialidad) SELECT p_id, e FROM unnest(v_esp) AS t(e);
        PERFORM sp_rev_registrar_historial('docente', p_id, 'guardar', v_estado, 'borrador', p_id_editor, NULL);
        RETURN 'directo';
    END IF;

    PERFORM sp_rev_transicion('docente', v_estado, v_op, 'proponer_cambio');  -- RN409 si inactivo/en_revision/baja

    v_nuevo := jsonb_build_object(
        'nombres', btrim(p_nombres), 'apellidos', btrim(p_apellidos),
        'grado_academico', NULLIF(btrim(COALESCE(p_grado, '')), ''),
        'id_departamento', p_id_departamento,
        'curso_principal', NULLIF(btrim(COALESCE(p_curso_principal, '')), ''),
        'condicion_laboral', NULLIF(btrim(COALESCE(p_condicion, '')), ''),
        'es_investigador', v_inv, 'categoria_renacyt', v_cat,
        'especialidades', to_jsonb(v_esp), '_id_editor', p_id_editor);
    FOREACH v_k IN ARRAY ARRAY['ruta_fotografia', 'encuadre_x', 'encuadre_y'] LOOP
        IF v_json ? v_k THEN v_nuevo := v_nuevo || jsonb_build_object(v_k, v_json -> v_k); END IF;
    END LOOP;

    UPDATE docente SET cambios_pendientes = v_nuevo, operacion_pendiente = 'cambio' WHERE id_docente = p_id;
    PERFORM sp_rev_registrar_historial('docente', p_id, 'proponer_cambio', v_estado, 'publicado', p_id_editor, NULL);
    RETURN 'cambio_pendiente';
END;
$$;

-- Auxiliar: valida un encuadre 0..100.
CREATE OR REPLACE FUNCTION sp_docente_validar_encuadre(p_x INT, p_y INT)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
IMMUTABLE
AS $$
BEGIN
    IF p_x IS NULL OR p_y IS NULL OR p_x NOT BETWEEN 0 AND 100 OR p_y NOT BETWEEN 0 AND 100 THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'El encuadre debe estar entre 0 y 100', DETAIL = 'encuadre';
    END IF;
END;
$$;

-- ---------------------------------------------------------------------
-- sp_docente_establecer_foto -> ruta anterior a borrar (NULL si queda pendiente o no habia)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_docente_establecer_foto(
    p_id_editor INT, p_id INT, p_ruta TEXT, p_encuadre_x INT, p_encuadre_y INT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
AS $$
DECLARE
    v_estado TEXT;
    v_op     TEXT;
    v_json   JSONB;
    v_ant    TEXT;
BEGIN
    SELECT estado::text, operacion_pendiente, cambios_pendientes, ruta_fotografia
      INTO v_estado, v_op, v_json, v_ant
      FROM docente WHERE id_docente = p_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION USING ERRCODE = 'RN404', MESSAGE = 'Registro no encontrado';
    END IF;

    PERFORM sp_rev_assert_rol(p_id_editor, ARRAY['Editor', 'Revisor']);
    IF char_length(btrim(COALESCE(p_ruta, ''))) = 0 OR char_length(p_ruta) > 255 THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'La ruta de la fotografía no es válida', DETAIL = 'ruta_fotografia';
    END IF;
    PERFORM sp_docente_validar_encuadre(p_encuadre_x, p_encuadre_y);

    IF v_estado = 'borrador' THEN
        UPDATE docente SET ruta_fotografia = p_ruta, encuadre_x = p_encuadre_x, encuadre_y = p_encuadre_y
         WHERE id_docente = p_id;
        RETURN v_ant;
    END IF;

    PERFORM sp_rev_transicion('docente', v_estado, v_op, 'proponer_cambio');
    -- Si ya habia una foto pendiente (aun no publicada), su archivo queda huerfano: se devuelve para borrarlo.
    v_ant := v_json ->> 'ruta_fotografia';
    UPDATE docente
       SET cambios_pendientes = COALESCE(v_json, '{}'::jsonb)
             || jsonb_build_object('ruta_fotografia', p_ruta, 'encuadre_x', p_encuadre_x,
                                   'encuadre_y', p_encuadre_y, '_id_editor', p_id_editor),
           operacion_pendiente = 'cambio'
     WHERE id_docente = p_id;
    PERFORM sp_rev_registrar_historial('docente', p_id, 'proponer_cambio', v_estado, 'publicado', p_id_editor, NULL);
    RETURN v_ant;
END;
$$;

-- ---------------------------------------------------------------------
-- sp_docente_establecer_encuadre
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_docente_establecer_encuadre(p_id_editor INT, p_id INT, p_x INT, p_y INT)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
AS $$
DECLARE
    v_estado TEXT;
    v_op     TEXT;
    v_json   JSONB;
BEGIN
    SELECT estado::text, operacion_pendiente, cambios_pendientes
      INTO v_estado, v_op, v_json
      FROM docente WHERE id_docente = p_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION USING ERRCODE = 'RN404', MESSAGE = 'Registro no encontrado';
    END IF;

    PERFORM sp_rev_assert_rol(p_id_editor, ARRAY['Editor', 'Revisor']);
    PERFORM sp_docente_validar_encuadre(p_x, p_y);

    IF v_estado = 'borrador' THEN
        UPDATE docente SET encuadre_x = p_x, encuadre_y = p_y WHERE id_docente = p_id;
        RETURN;
    END IF;

    PERFORM sp_rev_transicion('docente', v_estado, v_op, 'proponer_cambio');
    UPDATE docente
       SET cambios_pendientes = COALESCE(v_json, '{}'::jsonb)
             || jsonb_build_object('encuadre_x', p_x, 'encuadre_y', p_y, '_id_editor', p_id_editor),
           operacion_pendiente = 'cambio'
     WHERE id_docente = p_id;
    PERFORM sp_rev_registrar_historial('docente', p_id, 'proponer_cambio', v_estado, 'publicado', p_id_editor, NULL);
END;
$$;

-- ---------------------------------------------------------------------
-- sp_docente_enviar_revision: borrador -> en_revision
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_docente_enviar_revision(p_id_editor INT, p_id INT)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
AS $$
DECLARE
    v_estado TEXT;
    v_op     TEXT;
    v_grado  TEXT;
    v_curso  TEXT;
    v_nuevo  TEXT;
BEGIN
    SELECT estado::text, operacion_pendiente, grado_academico, curso_principal
      INTO v_estado, v_op, v_grado, v_curso
      FROM docente WHERE id_docente = p_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION USING ERRCODE = 'RN404', MESSAGE = 'Registro no encontrado';
    END IF;

    PERFORM sp_rev_assert_rol(p_id_editor, ARRAY['Editor', 'Revisor']);
    v_nuevo := sp_rev_transicion('docente', v_estado, v_op, 'enviar_revision');

    IF char_length(btrim(COALESCE(v_grado, ''))) = 0 THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'El grado académico es obligatorio para enviar a revisión', DETAIL = 'grado_academico';
    END IF;
    IF char_length(btrim(COALESCE(v_curso, ''))) = 0 THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'El curso principal es obligatorio para enviar a revisión', DETAIL = 'curso_principal';
    END IF;

    UPDATE docente SET estado = v_nuevo::estado_docente WHERE id_docente = p_id;
    PERFORM sp_rev_registrar_historial('docente', p_id, 'enviar_revision', v_estado, v_nuevo, p_id_editor, NULL);
END;
$$;

-- ---------------------------------------------------------------------
-- sp_docente_solicitar_baja: publicado sin operacion -> baja pendiente
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_docente_solicitar_baja(p_id_editor INT, p_id INT)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
AS $$
DECLARE
    v_estado TEXT;
    v_op     TEXT;
BEGIN
    SELECT estado::text, operacion_pendiente INTO v_estado, v_op
      FROM docente WHERE id_docente = p_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION USING ERRCODE = 'RN404', MESSAGE = 'Registro no encontrado';
    END IF;

    PERFORM sp_rev_assert_rol(p_id_editor, ARRAY['Editor', 'Revisor']);
    IF v_op IS NOT NULL THEN
        RAISE EXCEPTION USING ERRCODE = 'RN409',
            MESSAGE = 'Ya hay una operación pendiente de revisión', DETAIL = 'estado';
    END IF;
    PERFORM sp_rev_transicion('docente', v_estado, v_op, 'solicitar_baja');

    UPDATE docente
       SET operacion_pendiente = 'baja', cambios_pendientes = jsonb_build_object('_id_editor', p_id_editor)
     WHERE id_docente = p_id;
    PERFORM sp_rev_registrar_historial('docente', p_id, 'solicitar_baja', v_estado, v_estado, p_id_editor, NULL);
END;
$$;

-- ---------------------------------------------------------------------
-- sp_docente_reactivar: inactivo -> borrador
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_docente_reactivar(p_id_editor INT, p_id INT)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
AS $$
DECLARE
    v_estado TEXT;
    v_op     TEXT;
    v_nuevo  TEXT;
BEGIN
    SELECT estado::text, operacion_pendiente INTO v_estado, v_op
      FROM docente WHERE id_docente = p_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION USING ERRCODE = 'RN404', MESSAGE = 'Registro no encontrado';
    END IF;

    PERFORM sp_rev_assert_rol(p_id_editor, ARRAY['Editor', 'Revisor']);
    v_nuevo := sp_rev_transicion('docente', v_estado, v_op, 'reactivar');

    UPDATE docente SET estado = v_nuevo::estado_docente WHERE id_docente = p_id;
    PERFORM sp_rev_registrar_historial('docente', p_id, 'reactivar', v_estado, v_nuevo, p_id_editor, NULL);
END;
$$;

-- ---------------------------------------------------------------------
-- sp_docente_decidir -> estado nuevo (patron 4.1; descartar = RN409)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_docente_decidir(
    p_id_revisor INT, p_id INT, p_decision TEXT, p_observaciones TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
AS $$
DECLARE
    v_estado        TEXT;
    v_op            TEXT;
    v_editor        INT;
    v_editor_cambio INT;
    v_json          JSONB;
    v_nuevo         TEXT;
BEGIN
    SELECT estado::text, operacion_pendiente, id_editor,
           (cambios_pendientes ->> '_id_editor')::int, cambios_pendientes
      INTO v_estado, v_op, v_editor, v_editor_cambio, v_json
      FROM docente WHERE id_docente = p_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION USING ERRCODE = 'RN404', MESSAGE = 'Registro no encontrado';
    END IF;

    PERFORM sp_rev_assert_rol(p_id_revisor, ARRAY['Revisor']);
    IF p_decision = 'descartar' THEN   -- el docente no tiene descartar: 409 antes que 422
        PERFORM sp_rev_transicion('docente', v_estado, v_op, 'descartar');
    END IF;
    PERFORM sp_rev_validar_decision(v_editor, v_editor_cambio, p_id_revisor, p_decision, p_observaciones);
    v_nuevo := sp_rev_transicion('docente', v_estado, v_op, p_decision);

    IF p_decision = 'aprobar' AND v_op = 'cambio' THEN
        UPDATE docente
           SET nombres = CASE WHEN v_json ? 'nombres' THEN v_json ->> 'nombres' ELSE nombres END,
               apellidos = CASE WHEN v_json ? 'apellidos' THEN v_json ->> 'apellidos' ELSE apellidos END,
               grado_academico = CASE WHEN v_json ? 'grado_academico' THEN v_json ->> 'grado_academico' ELSE grado_academico END,
               id_departamento = CASE WHEN v_json ? 'id_departamento' THEN (v_json ->> 'id_departamento')::int ELSE id_departamento END,
               curso_principal = CASE WHEN v_json ? 'curso_principal' THEN v_json ->> 'curso_principal' ELSE curso_principal END,
               condicion_laboral = CASE WHEN v_json ? 'condicion_laboral' THEN (v_json ->> 'condicion_laboral')::condicion_laboral ELSE condicion_laboral END,
               es_investigador = CASE WHEN v_json ? 'es_investigador' THEN (v_json ->> 'es_investigador')::boolean ELSE es_investigador END,
               categoria_renacyt = CASE WHEN v_json ? 'categoria_renacyt' THEN v_json ->> 'categoria_renacyt' ELSE categoria_renacyt END,
               ruta_fotografia = CASE WHEN v_json ? 'ruta_fotografia' THEN v_json ->> 'ruta_fotografia' ELSE ruta_fotografia END,
               encuadre_x = CASE WHEN v_json ? 'encuadre_x' THEN (v_json ->> 'encuadre_x')::int ELSE encuadre_x END,
               encuadre_y = CASE WHEN v_json ? 'encuadre_y' THEN (v_json ->> 'encuadre_y')::int ELSE encuadre_y END
         WHERE id_docente = p_id;

        IF v_json ? 'especialidades' THEN
            DELETE FROM especialidad_docente WHERE id_docente = p_id;
            INSERT INTO especialidad_docente (id_docente, especialidad)
            SELECT p_id, x FROM jsonb_array_elements_text(v_json -> 'especialidades') AS t(x);
        END IF;
    END IF;

    UPDATE docente
       SET estado = v_nuevo::estado_docente,
           id_director_revisa = p_id_revisor,
           fecha_decision = now(),
           observaciones_revision = NULLIF(btrim(COALESCE(p_observaciones, '')), ''),
           operacion_pendiente = NULL,
           cambios_pendientes = NULL
     WHERE id_docente = p_id;

    PERFORM sp_rev_registrar_historial('docente', p_id, p_decision, v_estado, v_nuevo, p_id_revisor, p_observaciones);
    RETURN v_nuevo;
END;
$$;
