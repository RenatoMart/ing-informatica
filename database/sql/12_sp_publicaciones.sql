-- =====================================================================
-- 12_sp_publicaciones.sql - Procedimientos almacenados de publicaciones (P1, P2, HU2)
-- DISENO_BACKEND 2.2 y 4.3. Idempotente (CREATE OR REPLACE). Sin SET search_path
-- (se resuelve en el schema activo). Errores: RN403/RN404/RN409/RN422.
-- Contenido publicado: los cambios y bajas quedan en cambios_pendientes /
-- operacion_pendiente y el registro publico no cambia hasta que se aprueba.
-- Claves de cambios_pendientes: titulo, resumen, contenido, categoria,
-- fecha_publicacion_programada, archivos_agregar [{ruta,ancho,alto}],
-- archivos_quitar [id_archivo], _id_editor.
-- =====================================================================

-- Auxiliar: valida los campos editables de una publicacion.
CREATE OR REPLACE FUNCTION sp_publicacion_validar_campos(
    p_titulo TEXT, p_resumen TEXT, p_categoria TEXT, p_fecha_programada DATE)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
AS $$
DECLARE
    v_len INT := char_length(btrim(COALESCE(p_titulo, '')));
BEGIN
    IF v_len < 5 OR v_len > 200 THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422',
            MESSAGE = 'El título debe tener entre 5 y 200 caracteres', DETAIL = 'titulo';
    END IF;
    IF char_length(COALESCE(p_resumen, '')) > 500 THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422',
            MESSAGE = 'El resumen no puede superar 500 caracteres', DETAIL = 'resumen';
    END IF;
    IF char_length(COALESCE(p_categoria, '')) > 100 THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422',
            MESSAGE = 'La categoría no puede superar 100 caracteres', DETAIL = 'categoria';
    END IF;
    IF p_fecha_programada IS NOT NULL AND p_fecha_programada < current_date THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422',
            MESSAGE = 'La fecha programada no puede ser anterior a hoy',
            DETAIL = 'fecha_publicacion_programada';
    END IF;
END;
$$;

-- ---------------------------------------------------------------------
-- sp_publicacion_crear -> id_publicacion (borrador)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_publicacion_crear(
    p_id_editor INT, p_titulo TEXT, p_resumen TEXT, p_contenido TEXT,
    p_categoria TEXT, p_fecha_programada DATE)
RETURNS INT
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
AS $$
DECLARE
    v_id INT;
BEGIN
    PERFORM sp_rev_assert_rol(p_id_editor, ARRAY['Editor', 'Revisor']);
    PERFORM sp_publicacion_validar_campos(p_titulo, p_resumen, p_categoria, p_fecha_programada);

    INSERT INTO publicacion (titulo, resumen, contenido, categoria, estado,
                             fecha_publicacion_programada, fecha_creacion, id_editor)
    VALUES (btrim(p_titulo), NULLIF(btrim(COALESCE(p_resumen, '')), ''), p_contenido,
            NULLIF(btrim(COALESCE(p_categoria, '')), ''),
            sp_rev_transicion('publicacion', NULL, NULL, 'guardar')::estado_publicacion,
            p_fecha_programada, now(), p_id_editor)
    RETURNING id_publicacion INTO v_id;

    PERFORM sp_rev_registrar_historial('publicacion', v_id, 'guardar', NULL, 'borrador', p_id_editor, NULL);
    RETURN v_id;
END;
$$;

-- ---------------------------------------------------------------------
-- sp_publicacion_actualizar -> 'directo' | 'cambio_pendiente'
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_publicacion_actualizar(
    p_id_editor INT, p_id INT, p_titulo TEXT, p_resumen TEXT, p_contenido TEXT,
    p_categoria TEXT, p_fecha_programada DATE)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
AS $$
DECLARE
    v_estado TEXT;
    v_op     TEXT;
    v_json   JSONB;
    v_nuevo  JSONB;
BEGIN
    SELECT estado::text, operacion_pendiente, cambios_pendientes
      INTO v_estado, v_op, v_json
      FROM publicacion WHERE id_publicacion = p_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION USING ERRCODE = 'RN404', MESSAGE = 'Registro no encontrado';
    END IF;

    PERFORM sp_rev_assert_rol(p_id_editor, ARRAY['Editor', 'Revisor']);
    PERFORM sp_publicacion_validar_campos(p_titulo, p_resumen, p_categoria, p_fecha_programada);

    IF v_estado = 'borrador' THEN
        PERFORM sp_rev_transicion('publicacion', v_estado, v_op, 'guardar');
        UPDATE publicacion
           SET titulo = btrim(p_titulo),
               resumen = NULLIF(btrim(COALESCE(p_resumen, '')), ''),
               contenido = p_contenido,
               categoria = NULLIF(btrim(COALESCE(p_categoria, '')), ''),
               fecha_publicacion_programada = p_fecha_programada
         WHERE id_publicacion = p_id;
        PERFORM sp_rev_registrar_historial('publicacion', p_id, 'guardar', v_estado, 'borrador', p_id_editor, NULL);
        RETURN 'directo';
    END IF;

    -- publicada: RN409 si hay una baja pendiente o el estado no admite cambios
    PERFORM sp_rev_transicion('publicacion', v_estado, v_op, 'proponer_cambio');

    v_nuevo := jsonb_build_object(
        'titulo', btrim(p_titulo),
        'resumen', NULLIF(btrim(COALESCE(p_resumen, '')), ''),
        'contenido', p_contenido,
        'categoria', NULLIF(btrim(COALESCE(p_categoria, '')), ''),
        'fecha_publicacion_programada', p_fecha_programada,
        '_id_editor', p_id_editor);
    IF v_json ? 'archivos_agregar' THEN
        v_nuevo := v_nuevo || jsonb_build_object('archivos_agregar', v_json -> 'archivos_agregar');
    END IF;
    IF v_json ? 'archivos_quitar' THEN
        v_nuevo := v_nuevo || jsonb_build_object('archivos_quitar', v_json -> 'archivos_quitar');
    END IF;

    UPDATE publicacion SET cambios_pendientes = v_nuevo, operacion_pendiente = 'cambio'
     WHERE id_publicacion = p_id;
    PERFORM sp_rev_registrar_historial('publicacion', p_id, 'proponer_cambio', v_estado, 'publicada', p_id_editor, NULL);
    RETURN 'cambio_pendiente';
END;
$$;

-- ---------------------------------------------------------------------
-- sp_publicacion_agregar_archivo -> id_archivo (0 si el archivo queda pendiente)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_publicacion_agregar_archivo(
    p_id_editor INT, p_id INT, p_ruta TEXT, p_ancho INT, p_alto INT)
RETURNS INT
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
AS $$
DECLARE
    v_estado TEXT;
    v_op     TEXT;
    v_json   JSONB;
    v_total  INT;
    v_id     INT;
BEGIN
    SELECT estado::text, operacion_pendiente, cambios_pendientes
      INTO v_estado, v_op, v_json
      FROM publicacion WHERE id_publicacion = p_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION USING ERRCODE = 'RN404', MESSAGE = 'Registro no encontrado';
    END IF;

    PERFORM sp_rev_assert_rol(p_id_editor, ARRAY['Editor', 'Revisor']);

    IF char_length(btrim(COALESCE(p_ruta, ''))) = 0 OR char_length(p_ruta) > 255 THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'La ruta del archivo no es válida', DETAIL = 'ruta_archivo';
    END IF;

    SELECT count(*) INTO v_total FROM archivo_publicacion WHERE id_publicacion = p_id;

    IF v_estado = 'borrador' THEN
        IF v_total >= 6 THEN
            RAISE EXCEPTION USING ERRCODE = 'RN422',
                MESSAGE = 'Una publicación admite como máximo 6 archivos', DETAIL = 'archivos';
        END IF;
        INSERT INTO archivo_publicacion (id_publicacion, ruta_archivo, ancho_px, alto_px)
        VALUES (p_id, p_ruta, p_ancho, p_alto)
        RETURNING id_archivo INTO v_id;
        RETURN v_id;
    END IF;

    PERFORM sp_rev_transicion('publicacion', v_estado, v_op, 'proponer_cambio');

    v_total := v_total
        + COALESCE(jsonb_array_length(v_json -> 'archivos_agregar'), 0)
        - COALESCE(jsonb_array_length(v_json -> 'archivos_quitar'), 0);
    IF v_total >= 6 THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422',
            MESSAGE = 'Una publicación admite como máximo 6 archivos', DETAIL = 'archivos';
    END IF;

    v_json := COALESCE(v_json, '{}'::jsonb)
        || jsonb_build_object('_id_editor', p_id_editor,
             'archivos_agregar', COALESCE(v_json -> 'archivos_agregar', '[]'::jsonb)
                 || jsonb_build_array(jsonb_build_object('ruta', p_ruta, 'ancho', p_ancho, 'alto', p_alto)));
    UPDATE publicacion SET cambios_pendientes = v_json, operacion_pendiente = 'cambio'
     WHERE id_publicacion = p_id;
    PERFORM sp_rev_registrar_historial('publicacion', p_id, 'proponer_cambio', v_estado, 'publicada', p_id_editor, NULL);
    RETURN 0;
END;
$$;

-- ---------------------------------------------------------------------
-- sp_publicacion_quitar_archivo -> ruta a borrar (NULL si queda pendiente)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_publicacion_quitar_archivo(p_id_editor INT, p_id_archivo INT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
AS $$
DECLARE
    v_id     INT;
    v_ruta   TEXT;
    v_estado TEXT;
    v_op     TEXT;
    v_json   JSONB;
BEGIN
    SELECT a.id_publicacion, a.ruta_archivo INTO v_id, v_ruta
      FROM archivo_publicacion a WHERE a.id_archivo = p_id_archivo;
    IF NOT FOUND THEN
        RAISE EXCEPTION USING ERRCODE = 'RN404', MESSAGE = 'Archivo no encontrado';
    END IF;

    SELECT estado::text, operacion_pendiente, cambios_pendientes
      INTO v_estado, v_op, v_json
      FROM publicacion WHERE id_publicacion = v_id FOR UPDATE;

    PERFORM sp_rev_assert_rol(p_id_editor, ARRAY['Editor', 'Revisor']);

    IF v_estado = 'borrador' THEN
        DELETE FROM archivo_publicacion WHERE id_archivo = p_id_archivo;
        RETURN v_ruta;
    END IF;

    PERFORM sp_rev_transicion('publicacion', v_estado, v_op, 'proponer_cambio');

    IF COALESCE(v_json -> 'archivos_quitar', '[]'::jsonb) @> to_jsonb(p_id_archivo) THEN
        RETURN NULL;
    END IF;
    v_json := COALESCE(v_json, '{}'::jsonb)
        || jsonb_build_object('_id_editor', p_id_editor,
             'archivos_quitar', COALESCE(v_json -> 'archivos_quitar', '[]'::jsonb) || to_jsonb(p_id_archivo));
    UPDATE publicacion SET cambios_pendientes = v_json, operacion_pendiente = 'cambio'
     WHERE id_publicacion = v_id;
    PERFORM sp_rev_registrar_historial('publicacion', v_id, 'proponer_cambio', v_estado, 'publicada', p_id_editor, NULL);
    RETURN NULL;
END;
$$;

-- ---------------------------------------------------------------------
-- sp_publicacion_enviar_revision: borrador -> en_revision
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_publicacion_enviar_revision(p_id_editor INT, p_id INT)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
AS $$
DECLARE
    v_estado TEXT;
    v_op     TEXT;
    v_resumen TEXT;
    v_cat    TEXT;
    v_fecha  DATE;
    v_nuevo  TEXT;
BEGIN
    SELECT estado::text, operacion_pendiente, resumen, categoria, fecha_publicacion_programada
      INTO v_estado, v_op, v_resumen, v_cat, v_fecha
      FROM publicacion WHERE id_publicacion = p_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION USING ERRCODE = 'RN404', MESSAGE = 'Registro no encontrado';
    END IF;

    PERFORM sp_rev_assert_rol(p_id_editor, ARRAY['Editor', 'Revisor']);
    v_nuevo := sp_rev_transicion('publicacion', v_estado, v_op, 'enviar_revision');

    IF char_length(btrim(COALESCE(v_resumen, ''))) = 0 THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'El resumen es obligatorio para enviar a revisión', DETAIL = 'resumen';
    END IF;
    IF char_length(btrim(COALESCE(v_cat, ''))) = 0 THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'La categoría es obligatoria para enviar a revisión', DETAIL = 'categoria';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM archivo_publicacion WHERE id_publicacion = p_id) THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'Debe adjuntar al menos una imagen', DETAIL = 'archivos';
    END IF;
    IF v_fecha IS NOT NULL AND v_fecha < current_date THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422',
            MESSAGE = 'La fecha programada no puede ser anterior a hoy',
            DETAIL = 'fecha_publicacion_programada';
    END IF;

    UPDATE publicacion SET estado = v_nuevo::estado_publicacion WHERE id_publicacion = p_id;
    PERFORM sp_rev_registrar_historial('publicacion', p_id, 'enviar_revision', v_estado, v_nuevo, p_id_editor, NULL);
END;
$$;

-- ---------------------------------------------------------------------
-- sp_publicacion_solicitar_baja: publicada sin operacion -> baja pendiente
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_publicacion_solicitar_baja(p_id_editor INT, p_id INT)
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
      FROM publicacion WHERE id_publicacion = p_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION USING ERRCODE = 'RN404', MESSAGE = 'Registro no encontrado';
    END IF;

    PERFORM sp_rev_assert_rol(p_id_editor, ARRAY['Editor', 'Revisor']);
    IF v_op IS NOT NULL THEN
        RAISE EXCEPTION USING ERRCODE = 'RN409',
            MESSAGE = 'Ya hay una operación pendiente de revisión', DETAIL = 'estado';
    END IF;
    PERFORM sp_rev_transicion('publicacion', v_estado, v_op, 'solicitar_baja');

    UPDATE publicacion
       SET operacion_pendiente = 'baja',
           cambios_pendientes = jsonb_build_object('_id_editor', p_id_editor)
     WHERE id_publicacion = p_id;
    PERFORM sp_rev_registrar_historial('publicacion', p_id, 'solicitar_baja', v_estado, v_estado, p_id_editor, NULL);
END;
$$;

-- ---------------------------------------------------------------------
-- sp_publicacion_descartar: borrador -> descartada
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_publicacion_descartar(p_id_editor INT, p_id INT)
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
      FROM publicacion WHERE id_publicacion = p_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION USING ERRCODE = 'RN404', MESSAGE = 'Registro no encontrado';
    END IF;

    PERFORM sp_rev_assert_rol(p_id_editor, ARRAY['Editor', 'Revisor']);
    v_nuevo := sp_rev_transicion('publicacion', v_estado, v_op, 'descartar');
    IF v_estado <> 'borrador' THEN   -- la tabla 2.2 da descartar al Editor solo desde borrador
        RAISE EXCEPTION USING ERRCODE = 'RN409',
            MESSAGE = format('Acción no permitida en estado %s', v_estado), DETAIL = 'estado';
    END IF;

    UPDATE publicacion SET estado = v_nuevo::estado_publicacion WHERE id_publicacion = p_id;
    PERFORM sp_rev_registrar_historial('publicacion', p_id, 'descartar', v_estado, v_nuevo, p_id_editor, NULL);
END;
$$;

-- ---------------------------------------------------------------------
-- sp_publicacion_decidir -> estado nuevo (patron 4.1)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_publicacion_decidir(
    p_id_revisor INT, p_id INT, p_decision TEXT, p_observaciones TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
AS $$
DECLARE
    v_estado         TEXT;
    v_op             TEXT;
    v_editor         INT;
    v_editor_cambio  INT;
    v_json           JSONB;
    v_nuevo          TEXT;
    v_ag             JSONB;
BEGIN
    SELECT estado::text, operacion_pendiente, id_editor,
           (cambios_pendientes ->> '_id_editor')::int, cambios_pendientes
      INTO v_estado, v_op, v_editor, v_editor_cambio, v_json
      FROM publicacion WHERE id_publicacion = p_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION USING ERRCODE = 'RN404', MESSAGE = 'Registro no encontrado';
    END IF;

    PERFORM sp_rev_assert_rol(p_id_revisor, ARRAY['Revisor']);
    PERFORM sp_rev_validar_decision(v_editor, v_editor_cambio, p_id_revisor, p_decision, p_observaciones);
    v_nuevo := sp_rev_transicion('publicacion', v_estado, v_op, p_decision);

    IF p_decision = 'aprobar' AND v_op = 'cambio' THEN
        UPDATE publicacion
           SET titulo   = CASE WHEN v_json ? 'titulo'    THEN v_json ->> 'titulo'    ELSE titulo END,
               resumen  = CASE WHEN v_json ? 'resumen'   THEN v_json ->> 'resumen'   ELSE resumen END,
               contenido = CASE WHEN v_json ? 'contenido' THEN v_json ->> 'contenido' ELSE contenido END,
               categoria = CASE WHEN v_json ? 'categoria' THEN v_json ->> 'categoria' ELSE categoria END,
               fecha_publicacion_programada = CASE WHEN v_json ? 'fecha_publicacion_programada'
                    THEN (v_json ->> 'fecha_publicacion_programada')::date
                    ELSE fecha_publicacion_programada END
         WHERE id_publicacion = p_id;

        DELETE FROM archivo_publicacion
         WHERE id_publicacion = p_id
           AND id_archivo IN (SELECT (x)::int FROM jsonb_array_elements_text(COALESCE(v_json -> 'archivos_quitar', '[]'::jsonb)) AS t(x));

        FOR v_ag IN SELECT e FROM jsonb_array_elements(COALESCE(v_json -> 'archivos_agregar', '[]'::jsonb)) AS t(e) LOOP
            INSERT INTO archivo_publicacion (id_publicacion, ruta_archivo, ancho_px, alto_px)
            VALUES (p_id, v_ag ->> 'ruta', (v_ag ->> 'ancho')::int, (v_ag ->> 'alto')::int);
        END LOOP;
    END IF;

    UPDATE publicacion
       SET estado = v_nuevo::estado_publicacion,
           id_director_revisa = p_id_revisor,
           fecha_decision = now(),
           observaciones_revision = NULLIF(btrim(COALESCE(p_observaciones, '')), ''),
           operacion_pendiente = NULL,
           cambios_pendientes = NULL
     WHERE id_publicacion = p_id;

    PERFORM sp_rev_registrar_historial('publicacion', p_id, p_decision, v_estado, v_nuevo, p_id_revisor, p_observaciones);
    RETURN v_nuevo;
END;
$$;
