-- =====================================================================
-- 15_sp_documentos_admision.sql - Documentos oficiales y admision (P7, P8, HU5)
-- DISENO_BACKEND 2.2 y 4.6. Idempotente (CREATE OR REPLACE). Sin SET search_path.
-- Documento y campana no usan operacion_pendiente: corregir lo publicado es
-- crear una version nueva (reemplazar / duplicar).
-- =====================================================================

-- Auxiliar: valida los campos de un documento.
CREATE OR REPLACE FUNCTION sp_documento_validar_campos(
    p_tipo TEXT, p_numero TEXT, p_titulo TEXT, p_fecha_emision DATE,
    p_id_departamento INT, p_fecha_vigencia DATE, p_archivo_pdf TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
AS $$
BEGIN
    IF p_tipo IS NULL OR p_tipo NOT IN ('resolucion', 'guia', 'politica') THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'El tipo debe ser resolución, guía o política', DETAIL = 'tipo';
    END IF;
    IF char_length(btrim(COALESCE(p_numero, ''))) = 0 OR char_length(p_numero) > 50 THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'El número es obligatorio (máximo 50 caracteres)', DETAIL = 'numero';
    END IF;
    IF char_length(btrim(COALESCE(p_titulo, ''))) = 0 OR char_length(p_titulo) > 200 THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'El título es obligatorio (máximo 200 caracteres)', DETAIL = 'titulo';
    END IF;
    IF p_fecha_emision IS NULL THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'La fecha de emisión es obligatoria', DETAIL = 'fecha_emision';
    END IF;
    IF p_fecha_vigencia IS NULL OR p_fecha_vigencia < p_fecha_emision THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422',
            MESSAGE = 'La fecha de vigencia no puede ser anterior a la de emisión', DETAIL = 'fecha_vigencia';
    END IF;
    IF p_id_departamento IS NULL OR NOT EXISTS (SELECT 1 FROM departamento WHERE id_departamento = p_id_departamento) THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'El departamento emisor no existe', DETAIL = 'id_departamento';
    END IF;
    IF p_archivo_pdf IS NOT NULL AND (char_length(btrim(p_archivo_pdf)) = 0 OR char_length(p_archivo_pdf) > 255) THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'La ruta del PDF no es válida', DETAIL = 'archivo_pdf';
    END IF;
END;
$$;

-- ---------------------------------------------------------------------
-- sp_documento_registrar -> id_documento (en_revision)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_documento_registrar(
    p_id_editor INT, p_tipo TEXT, p_numero TEXT, p_titulo TEXT, p_fecha_emision DATE,
    p_id_departamento INT, p_fecha_vigencia DATE, p_archivo_pdf TEXT, p_id_version_anterior INT)
RETURNS INT
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
AS $$
DECLARE
    v_id     INT;
    v_ant_t  TEXT;
    v_ant_e  TEXT;
BEGIN
    PERFORM sp_rev_assert_rol(p_id_editor, ARRAY['Editor', 'Revisor']);
    IF p_archivo_pdf IS NULL THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'El archivo PDF es obligatorio', DETAIL = 'archivo_pdf';
    END IF;
    PERFORM sp_documento_validar_campos(p_tipo, p_numero, p_titulo, p_fecha_emision,
                p_id_departamento, p_fecha_vigencia, p_archivo_pdf);

    IF p_id_version_anterior IS NOT NULL THEN
        SELECT tipo::text, estado::text INTO v_ant_t, v_ant_e
          FROM documento_oficial WHERE id_documento = p_id_version_anterior FOR UPDATE;
        IF NOT FOUND THEN
            RAISE EXCEPTION USING ERRCODE = 'RN404', MESSAGE = 'La versión anterior no existe';
        END IF;
        IF v_ant_t <> p_tipo THEN
            RAISE EXCEPTION USING ERRCODE = 'RN409',
                MESSAGE = 'La versión anterior debe ser del mismo tipo', DETAIL = 'id_version_anterior';
        END IF;
        IF v_ant_e NOT IN ('vigente', 'vencido') THEN
            RAISE EXCEPTION USING ERRCODE = 'RN409',
                MESSAGE = 'Solo se puede reemplazar un documento vigente o vencido', DETAIL = 'id_version_anterior';
        END IF;
        IF EXISTS (SELECT 1 FROM documento_oficial WHERE id_version_anterior = p_id_version_anterior) THEN
            RAISE EXCEPTION USING ERRCODE = 'RN409',
                MESSAGE = 'Ese documento ya tiene una versión de reemplazo', DETAIL = 'id_version_anterior';
        END IF;
    END IF;

    INSERT INTO documento_oficial (tipo, numero, titulo, fecha_emision, id_departamento_emisor,
                                   fecha_vigencia, archivo_pdf, estado, id_version_anterior, id_editor)
    VALUES (p_tipo::tipo_documento, btrim(p_numero), btrim(p_titulo), p_fecha_emision, p_id_departamento,
            p_fecha_vigencia, p_archivo_pdf,
            sp_rev_transicion('documento', NULL, NULL, 'guardar')::estado_documento,
            p_id_version_anterior, p_id_editor)
    RETURNING id_documento INTO v_id;

    PERFORM sp_rev_registrar_historial('documento', v_id, 'guardar', NULL, 'en_revision', p_id_editor, NULL);
    RETURN v_id;
END;
$$;

-- ---------------------------------------------------------------------
-- sp_documento_actualizar -> ruta anterior del PDF si se reemplaza (NULL si no)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_documento_actualizar(
    p_id_editor INT, p_id INT, p_tipo TEXT, p_numero TEXT, p_titulo TEXT, p_fecha_emision DATE,
    p_id_departamento INT, p_fecha_vigencia DATE, p_archivo_pdf TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
AS $$
DECLARE
    v_estado TEXT;
    v_pdf    TEXT;
    v_nuevo  TEXT;
BEGIN
    SELECT estado::text, archivo_pdf INTO v_estado, v_pdf
      FROM documento_oficial WHERE id_documento = p_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION USING ERRCODE = 'RN404', MESSAGE = 'Registro no encontrado';
    END IF;

    PERFORM sp_rev_assert_rol(p_id_editor, ARRAY['Editor', 'Revisor']);
    IF v_estado <> 'no_publicado' THEN
        RAISE EXCEPTION USING ERRCODE = 'RN409',
            MESSAGE = format('Acción no permitida en estado %s', v_estado), DETAIL = 'estado';
    END IF;
    v_nuevo := sp_rev_transicion('documento', v_estado, NULL, 'guardar');
    PERFORM sp_documento_validar_campos(p_tipo, p_numero, p_titulo, p_fecha_emision,
                p_id_departamento, p_fecha_vigencia, p_archivo_pdf);

    UPDATE documento_oficial
       SET tipo = p_tipo::tipo_documento, numero = btrim(p_numero), titulo = btrim(p_titulo),
           fecha_emision = p_fecha_emision, id_departamento_emisor = p_id_departamento,
           fecha_vigencia = p_fecha_vigencia, archivo_pdf = COALESCE(p_archivo_pdf, archivo_pdf)
     WHERE id_documento = p_id;
    PERFORM sp_rev_registrar_historial('documento', p_id, 'guardar', v_estado, v_nuevo, p_id_editor, NULL);

    IF p_archivo_pdf IS NOT NULL AND p_archivo_pdf <> v_pdf THEN
        RETURN v_pdf;
    END IF;
    RETURN NULL;
END;
$$;

-- ---------------------------------------------------------------------
-- sp_documento_reenviar: no_publicado -> en_revision
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_documento_reenviar(p_id_editor INT, p_id INT)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
AS $$
DECLARE
    v_estado TEXT;
    v_nuevo  TEXT;
BEGIN
    SELECT estado::text INTO v_estado FROM documento_oficial WHERE id_documento = p_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION USING ERRCODE = 'RN404', MESSAGE = 'Registro no encontrado';
    END IF;

    PERFORM sp_rev_assert_rol(p_id_editor, ARRAY['Editor', 'Revisor']);
    v_nuevo := sp_rev_transicion('documento', v_estado, NULL, 'reenviar');

    UPDATE documento_oficial SET estado = v_nuevo::estado_documento, id_editor = p_id_editor
     WHERE id_documento = p_id;
    PERFORM sp_rev_registrar_historial('documento', p_id, 'reenviar', v_estado, v_nuevo, p_id_editor, NULL);
END;
$$;

-- ---------------------------------------------------------------------
-- sp_documento_decidir -> estado nuevo
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_documento_decidir(
    p_id_revisor INT, p_id INT, p_decision TEXT, p_observaciones TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
AS $$
DECLARE
    v_estado  TEXT;
    v_editor  INT;
    v_vig     DATE;
    v_ant     INT;
    v_ant_e   TEXT;
    v_nuevo   TEXT;
BEGIN
    SELECT estado::text, id_editor, fecha_vigencia, id_version_anterior
      INTO v_estado, v_editor, v_vig, v_ant
      FROM documento_oficial WHERE id_documento = p_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION USING ERRCODE = 'RN404', MESSAGE = 'Registro no encontrado';
    END IF;

    PERFORM sp_rev_assert_rol(p_id_revisor, ARRAY['Revisor']);
    PERFORM sp_rev_validar_decision(v_editor, NULL, p_id_revisor, p_decision, p_observaciones);
    v_nuevo := sp_rev_transicion('documento', v_estado, NULL, p_decision);

    IF p_decision = 'aprobar' THEN
        IF v_vig < current_date THEN
            RAISE EXCEPTION USING ERRCODE = 'RN422',
                MESSAGE = 'No se puede aprobar un documento con la vigencia vencida', DETAIL = 'fecha_vigencia';
        END IF;
        IF v_ant IS NOT NULL THEN
            SELECT estado::text INTO v_ant_e FROM documento_oficial WHERE id_documento = v_ant FOR UPDATE;
            IF v_ant_e IN ('vigente', 'vencido') THEN
                UPDATE documento_oficial SET estado = sp_rev_transicion('documento', v_ant_e, NULL, 'reemplazar')::estado_documento
                 WHERE id_documento = v_ant;
                PERFORM sp_rev_registrar_historial('documento', v_ant, 'reemplazar', v_ant_e, 'historico',
                    p_id_revisor, format('Reemplazado por el documento %s', p_id));
            END IF;
        END IF;
    END IF;

    UPDATE documento_oficial
       SET estado = v_nuevo::estado_documento, id_director_revisa = p_id_revisor, fecha_decision = now(),
           observaciones_revision = NULLIF(btrim(COALESCE(p_observaciones, '')), '')
     WHERE id_documento = p_id;
    PERFORM sp_rev_registrar_historial('documento', p_id, p_decision, v_estado, v_nuevo, p_id_revisor, p_observaciones);
    RETURN v_nuevo;
END;
$$;

-- ---------------------------------------------------------------------
-- sp_documento_vencer_expirados: vigente con vigencia pasada -> vencido (tarea S)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_documento_vencer_expirados()
RETURNS TABLE (id_documento INT, tipo TEXT, numero TEXT, titulo TEXT, correo_departamento TEXT)
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
AS $$
#variable_conflict use_column
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        WITH upd AS (
            UPDATE documento_oficial d
               SET estado = sp_rev_transicion('documento', 'vigente', NULL, 'vencer')::estado_documento
             WHERE d.estado = 'vigente' AND d.fecha_vigencia < current_date
            RETURNING d.id_documento, d.tipo, d.numero, d.titulo, d.id_departamento_emisor
        )
        SELECT u.id_documento, u.tipo::text AS tipo, u.numero::text AS numero, u.titulo::text AS titulo,
               dp.correo::text AS correo
          FROM upd u LEFT JOIN departamento dp ON dp.id_departamento = u.id_departamento_emisor
         ORDER BY u.id_documento
    LOOP
        PERFORM sp_rev_registrar_historial('documento', r.id_documento, 'vencer', 'vigente', 'vencido', NULL, NULL);
        id_documento := r.id_documento; tipo := r.tipo; numero := r.numero;
        titulo := r.titulo; correo_departamento := r.correo;
        RETURN NEXT;
    END LOOP;
END;
$$;

-- ---------------------------------------------------------------------
-- sp_documento_por_vencer: solo lectura, vigentes que vencen en p_dias dias exactos
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_documento_por_vencer(p_dias INT)
RETURNS TABLE (id_documento INT, tipo TEXT, numero TEXT, titulo TEXT, correo_departamento TEXT)
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
AS $$
#variable_conflict use_column
BEGIN
    RETURN QUERY
    SELECT d.id_documento, d.tipo::text, d.numero::text, d.titulo::text, dp.correo::text
      FROM documento_oficial d
      LEFT JOIN departamento dp ON dp.id_departamento = d.id_departamento_emisor
     WHERE d.estado = 'vigente' AND d.fecha_vigencia = current_date + COALESCE(p_dias, 15)
     ORDER BY d.id_documento;
END;
$$;

-- =====================================================================
-- Campanas de admision
-- =====================================================================

-- Auxiliar: valida cabecera de campana.
CREATE OR REPLACE FUNCTION sp_campana_validar_cabecera(
    p_anio INT, p_proceso TEXT, p_fecha_inicio DATE, p_fecha_fin DATE, p_url_portal TEXT, p_url_estadisticas TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
IMMUTABLE
AS $$
BEGIN
    IF p_anio IS NULL OR p_anio NOT BETWEEN 2000 AND 2100 THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'El año de la campaña no es válido', DETAIL = 'anio';
    END IF;
    IF char_length(COALESCE(p_proceso, '')) > 50 THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'El proceso no puede superar 50 caracteres', DETAIL = 'proceso';
    END IF;
    IF p_fecha_inicio IS NOT NULL AND p_fecha_fin IS NOT NULL AND p_fecha_fin < p_fecha_inicio THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'La fecha de fin no puede ser anterior a la de inicio', DETAIL = 'fecha_fin';
    END IF;
    IF char_length(COALESCE(p_url_portal, '')) > 255 THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'La URL del portal no puede superar 255 caracteres', DETAIL = 'url_portal';
    END IF;
    IF char_length(COALESCE(p_url_estadisticas, '')) > 255 THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'La URL de estadísticas no puede superar 255 caracteres', DETAIL = 'url_estadisticas';
    END IF;
END;
$$;

-- ---------------------------------------------------------------------
-- sp_campana_crear -> id_campana (borrador)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_campana_crear(
    p_id_editor INT, p_anio INT, p_proceso TEXT, p_fecha_inicio DATE, p_fecha_fin DATE,
    p_url_portal TEXT, p_url_estadisticas TEXT)
RETURNS INT
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
AS $$
DECLARE
    v_id INT;
    v_proceso TEXT := NULLIF(btrim(COALESCE(p_proceso, '')), '');
BEGIN
    PERFORM sp_rev_assert_rol(p_id_editor, ARRAY['Editor', 'Revisor']);
    PERFORM sp_campana_validar_cabecera(p_anio, p_proceso, p_fecha_inicio, p_fecha_fin, p_url_portal, p_url_estadisticas);

    IF EXISTS (SELECT 1 FROM campana_admision
                WHERE anio = p_anio AND proceso IS NOT DISTINCT FROM v_proceso
                  AND estado IN ('borrador', 'en_revision')) THEN
        RAISE EXCEPTION USING ERRCODE = 'RN409',
            MESSAGE = 'Ya existe una campaña en borrador o en revisión para ese año y proceso', DETAIL = 'anio';
    END IF;

    INSERT INTO campana_admision (anio, proceso, estado, fecha_inicio, fecha_fin, url_portal, url_estadisticas, id_editor)
    VALUES (p_anio, v_proceso, sp_rev_transicion('campana', NULL, NULL, 'guardar')::estado_campana,
            p_fecha_inicio, p_fecha_fin, NULLIF(btrim(COALESCE(p_url_portal, '')), ''),
            NULLIF(btrim(COALESCE(p_url_estadisticas, '')), ''), p_id_editor)
    RETURNING id_campana INTO v_id;

    PERFORM sp_rev_registrar_historial('campana', v_id, 'guardar', NULL, 'borrador', p_id_editor, NULL);
    RETURN v_id;
END;
$$;

-- ---------------------------------------------------------------------
-- sp_campana_actualizar: solo borrador
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_campana_actualizar(
    p_id_editor INT, p_id INT, p_anio INT, p_proceso TEXT, p_fecha_inicio DATE, p_fecha_fin DATE,
    p_url_portal TEXT, p_url_estadisticas TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
AS $$
DECLARE
    v_estado TEXT;
    v_proceso TEXT := NULLIF(btrim(COALESCE(p_proceso, '')), '');
BEGIN
    SELECT estado::text INTO v_estado FROM campana_admision WHERE id_campana = p_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION USING ERRCODE = 'RN404', MESSAGE = 'Registro no encontrado';
    END IF;

    PERFORM sp_rev_assert_rol(p_id_editor, ARRAY['Editor', 'Revisor']);
    PERFORM sp_rev_transicion('campana', v_estado, NULL, 'guardar');
    PERFORM sp_campana_validar_cabecera(p_anio, p_proceso, p_fecha_inicio, p_fecha_fin, p_url_portal, p_url_estadisticas);

    IF EXISTS (SELECT 1 FROM campana_admision
                WHERE anio = p_anio AND proceso IS NOT DISTINCT FROM v_proceso
                  AND estado IN ('borrador', 'en_revision') AND id_campana <> p_id) THEN
        RAISE EXCEPTION USING ERRCODE = 'RN409',
            MESSAGE = 'Ya existe una campaña en borrador o en revisión para ese año y proceso', DETAIL = 'anio';
    END IF;

    UPDATE campana_admision
       SET anio = p_anio, proceso = v_proceso, fecha_inicio = p_fecha_inicio, fecha_fin = p_fecha_fin,
           url_portal = NULLIF(btrim(COALESCE(p_url_portal, '')), ''),
           url_estadisticas = NULLIF(btrim(COALESCE(p_url_estadisticas, '')), '')
     WHERE id_campana = p_id;
    PERFORM sp_rev_registrar_historial('campana', p_id, 'guardar', v_estado, 'borrador', p_id_editor, NULL);
END;
$$;

-- ---------------------------------------------------------------------
-- sp_campana_duplicar -> id del nuevo borrador (cabecera, modalidades e hitos)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_campana_duplicar(p_id_editor INT, p_id_origen INT)
RETURNS INT
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
AS $$
DECLARE
    o  campana_admision%ROWTYPE;
    v_id INT;
BEGIN
    SELECT * INTO o FROM campana_admision WHERE id_campana = p_id_origen;
    IF NOT FOUND THEN
        RAISE EXCEPTION USING ERRCODE = 'RN404', MESSAGE = 'Campaña no encontrada';
    END IF;

    PERFORM sp_rev_assert_rol(p_id_editor, ARRAY['Editor', 'Revisor']);
    IF EXISTS (SELECT 1 FROM campana_admision
                WHERE anio = o.anio AND proceso IS NOT DISTINCT FROM o.proceso
                  AND estado IN ('borrador', 'en_revision')) THEN
        RAISE EXCEPTION USING ERRCODE = 'RN409',
            MESSAGE = 'Ya existe una campaña en borrador o en revisión para ese año y proceso', DETAIL = 'anio';
    END IF;

    INSERT INTO campana_admision (anio, proceso, estado, fecha_inicio, fecha_fin, url_portal, url_estadisticas, id_editor)
    VALUES (o.anio, o.proceso, sp_rev_transicion('campana', NULL, NULL, 'guardar')::estado_campana,
            o.fecha_inicio, o.fecha_fin, o.url_portal, o.url_estadisticas, p_id_editor)
    RETURNING id_campana INTO v_id;

    INSERT INTO modalidad_admision (id_campana, nombre, dirigido_a, vacantes, descripcion)
    SELECT v_id, nombre, dirigido_a, vacantes, descripcion FROM modalidad_admision
     WHERE id_campana = p_id_origen ORDER BY id_modalidad;
    INSERT INTO cronograma_admision (id_campana, hito, fecha)
    SELECT v_id, hito, fecha FROM cronograma_admision WHERE id_campana = p_id_origen ORDER BY id_hito;

    PERFORM sp_rev_registrar_historial('campana', v_id, 'guardar', NULL, 'borrador', p_id_editor,
        format('Duplicada de la campaña %s', p_id_origen));
    RETURN v_id;
END;
$$;

-- Auxiliar: bloquea la campana y exige borrador; devuelve sus fechas.
CREATE OR REPLACE FUNCTION sp_campana_exigir_borrador(p_id INT, OUT o_inicio DATE, OUT o_fin DATE)
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
AS $$
DECLARE
    v_estado TEXT;
BEGIN
    SELECT estado::text, fecha_inicio, fecha_fin INTO v_estado, o_inicio, o_fin
      FROM campana_admision WHERE id_campana = p_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION USING ERRCODE = 'RN404', MESSAGE = 'Campaña no encontrada';
    END IF;
    PERFORM sp_rev_transicion('campana', v_estado, NULL, 'guardar');   -- solo borrador admite edicion
END;
$$;

-- ---------------------------------------------------------------------
-- sp_modalidad_guardar: p_id_modalidad NULL = crear. -> id_modalidad
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_modalidad_guardar(
    p_id_editor INT, p_id_campana INT, p_id_modalidad INT, p_nombre TEXT,
    p_dirigido_a TEXT, p_vacantes INT, p_descripcion TEXT)
RETURNS INT
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
AS $$
DECLARE
    v_id INT;
BEGIN
    PERFORM sp_rev_assert_rol(p_id_editor, ARRAY['Editor', 'Revisor']);
    PERFORM sp_campana_exigir_borrador(p_id_campana);

    IF char_length(btrim(COALESCE(p_nombre, ''))) = 0 OR char_length(p_nombre) > 100 THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'El nombre es obligatorio (máximo 100 caracteres)', DETAIL = 'nombre';
    END IF;
    IF char_length(COALESCE(p_dirigido_a, '')) > 150 THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'El campo "dirigido a" no puede superar 150 caracteres', DETAIL = 'dirigido_a';
    END IF;
    IF p_vacantes IS NULL OR p_vacantes <= 0 THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'Las vacantes deben ser mayores que cero', DETAIL = 'vacantes';
    END IF;

    IF p_id_modalidad IS NULL THEN
        INSERT INTO modalidad_admision (id_campana, nombre, dirigido_a, vacantes, descripcion)
        VALUES (p_id_campana, btrim(p_nombre), NULLIF(btrim(COALESCE(p_dirigido_a, '')), ''), p_vacantes, p_descripcion)
        RETURNING id_modalidad INTO v_id;
    ELSE
        UPDATE modalidad_admision
           SET nombre = btrim(p_nombre), dirigido_a = NULLIF(btrim(COALESCE(p_dirigido_a, '')), ''),
               vacantes = p_vacantes, descripcion = p_descripcion
         WHERE id_modalidad = p_id_modalidad AND id_campana = p_id_campana
        RETURNING id_modalidad INTO v_id;
        IF NOT FOUND THEN
            RAISE EXCEPTION USING ERRCODE = 'RN404', MESSAGE = 'Modalidad no encontrada';
        END IF;
    END IF;
    RETURN v_id;
END;
$$;

-- ---------------------------------------------------------------------
-- sp_modalidad_eliminar
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_modalidad_eliminar(p_id_editor INT, p_id_modalidad INT)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
AS $$
DECLARE
    v_camp INT;
BEGIN
    SELECT id_campana INTO v_camp FROM modalidad_admision WHERE id_modalidad = p_id_modalidad;
    IF NOT FOUND THEN
        RAISE EXCEPTION USING ERRCODE = 'RN404', MESSAGE = 'Modalidad no encontrada';
    END IF;
    PERFORM sp_rev_assert_rol(p_id_editor, ARRAY['Editor', 'Revisor']);
    PERFORM sp_campana_exigir_borrador(v_camp);
    DELETE FROM modalidad_admision WHERE id_modalidad = p_id_modalidad;
END;
$$;

-- ---------------------------------------------------------------------
-- sp_hito_guardar: p_id_hito NULL = crear. -> id_hito
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_hito_guardar(
    p_id_editor INT, p_id_campana INT, p_id_hito INT, p_hito TEXT, p_fecha DATE)
RETURNS INT
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
AS $$
DECLARE
    v_ini DATE;
    v_fin DATE;
    v_id  INT;
BEGIN
    PERFORM sp_rev_assert_rol(p_id_editor, ARRAY['Editor', 'Revisor']);
    SELECT o_inicio, o_fin INTO v_ini, v_fin FROM sp_campana_exigir_borrador(p_id_campana);

    IF char_length(btrim(COALESCE(p_hito, ''))) = 0 OR char_length(p_hito) > 150 THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'El hito es obligatorio (máximo 150 caracteres)', DETAIL = 'hito';
    END IF;
    IF p_fecha IS NULL OR (v_ini IS NOT NULL AND p_fecha < v_ini) OR (v_fin IS NOT NULL AND p_fecha > v_fin) THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422',
            MESSAGE = 'La fecha del hito debe estar dentro del rango de la campaña', DETAIL = 'fecha';
    END IF;

    IF p_id_hito IS NULL THEN
        INSERT INTO cronograma_admision (id_campana, hito, fecha) VALUES (p_id_campana, btrim(p_hito), p_fecha)
        RETURNING id_hito INTO v_id;
    ELSE
        UPDATE cronograma_admision SET hito = btrim(p_hito), fecha = p_fecha
         WHERE id_hito = p_id_hito AND id_campana = p_id_campana RETURNING id_hito INTO v_id;
        IF NOT FOUND THEN
            RAISE EXCEPTION USING ERRCODE = 'RN404', MESSAGE = 'Hito no encontrado';
        END IF;
    END IF;
    RETURN v_id;
END;
$$;

-- ---------------------------------------------------------------------
-- sp_hito_eliminar
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_hito_eliminar(p_id_editor INT, p_id_hito INT)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
AS $$
DECLARE
    v_camp INT;
BEGIN
    SELECT id_campana INTO v_camp FROM cronograma_admision WHERE id_hito = p_id_hito;
    IF NOT FOUND THEN
        RAISE EXCEPTION USING ERRCODE = 'RN404', MESSAGE = 'Hito no encontrado';
    END IF;
    PERFORM sp_rev_assert_rol(p_id_editor, ARRAY['Editor', 'Revisor']);
    PERFORM sp_campana_exigir_borrador(v_camp);
    DELETE FROM cronograma_admision WHERE id_hito = p_id_hito;
END;
$$;

-- ---------------------------------------------------------------------
-- sp_campana_validar: filas (nivel='error', codigo, mensaje); vacio = sin errores
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_campana_validar(p_id INT)
RETURNS TABLE (nivel TEXT, codigo TEXT, mensaje TEXT)
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
AS $$
DECLARE
    c campana_admision%ROWTYPE;
BEGIN
    SELECT * INTO c FROM campana_admision WHERE id_campana = p_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION USING ERRCODE = 'RN404', MESSAGE = 'Campaña no encontrada';
    END IF;

    IF c.fecha_inicio IS NULL OR c.fecha_fin IS NULL THEN
        RETURN QUERY SELECT 'error', 'FECHAS_FALTANTES', 'Faltan las fechas de inicio o fin de la campaña';
    ELSIF c.fecha_inicio > c.fecha_fin THEN
        RETURN QUERY SELECT 'error', 'FECHAS_INVERTIDAS', 'La fecha de inicio es posterior a la de fin';
    END IF;

    IF EXISTS (SELECT 1 FROM cronograma_admision h
                WHERE h.id_campana = p_id
                  AND (h.fecha < c.fecha_inicio OR h.fecha > c.fecha_fin)) THEN
        RETURN QUERY SELECT 'error', 'HITO_FUERA_RANGO', 'Hay hitos del cronograma fuera del rango de la campaña';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM modalidad_admision WHERE id_campana = p_id) THEN
        RETURN QUERY SELECT 'error', 'SIN_MODALIDADES', 'La campaña no tiene modalidades de ingreso';
    ELSIF EXISTS (SELECT 1 FROM modalidad_admision m WHERE m.id_campana = p_id AND (m.vacantes IS NULL OR m.vacantes <= 0)) THEN
        RETURN QUERY SELECT 'error', 'VACANTES_INVALIDAS', 'Todas las modalidades deben tener vacantes mayores que cero';
    END IF;

    IF c.url_portal IS NULL OR c.url_portal !~ '^https://.+' THEN
        RETURN QUERY SELECT 'error', 'URL_PORTAL', 'La URL del portal de inscripción debe empezar por https://';
    END IF;
    IF c.url_estadisticas IS NULL OR c.url_estadisticas !~ '^https://.+' THEN
        RETURN QUERY SELECT 'error', 'URL_ESTADISTICAS', 'La URL de estadísticas debe empezar por https://';
    END IF;
END;
$$;

-- ---------------------------------------------------------------------
-- sp_campana_enviar_revision: borrador -> en_revision
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_campana_enviar_revision(p_id_editor INT, p_id INT, p_enlaces_verificados BOOLEAN)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
AS $$
DECLARE
    v_estado TEXT;
    v_nuevo  TEXT;
    v_msg    TEXT;
BEGIN
    SELECT estado::text INTO v_estado FROM campana_admision WHERE id_campana = p_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION USING ERRCODE = 'RN404', MESSAGE = 'Registro no encontrado';
    END IF;

    PERFORM sp_rev_assert_rol(p_id_editor, ARRAY['Editor', 'Revisor']);
    v_nuevo := sp_rev_transicion('campana', v_estado, NULL, 'enviar_revision');

    IF NOT COALESCE(p_enlaces_verificados, FALSE) THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'Hay enlaces no operativos', DETAIL = 'url_portal';
    END IF;

    SELECT string_agg(mensaje, '; ') INTO v_msg FROM sp_campana_validar(p_id) WHERE nivel = 'error';
    IF v_msg IS NOT NULL THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = v_msg, DETAIL = 'campana';
    END IF;

    UPDATE campana_admision SET estado = v_nuevo::estado_campana WHERE id_campana = p_id;
    PERFORM sp_rev_registrar_historial('campana', p_id, 'enviar_revision', v_estado, v_nuevo, p_id_editor, NULL);
END;
$$;

-- ---------------------------------------------------------------------
-- sp_campana_decidir -> estado nuevo (descartar = RN409)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_campana_decidir(
    p_id_revisor INT, p_id INT, p_decision TEXT, p_observaciones TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
AS $$
DECLARE
    v_estado TEXT;
    v_editor INT;
    v_fin    DATE;
    v_nuevo  TEXT;
    r        RECORD;
BEGIN
    SELECT estado::text, id_editor, fecha_fin INTO v_estado, v_editor, v_fin
      FROM campana_admision WHERE id_campana = p_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION USING ERRCODE = 'RN404', MESSAGE = 'Registro no encontrado';
    END IF;

    PERFORM sp_rev_assert_rol(p_id_revisor, ARRAY['Revisor']);
    IF p_decision = 'descartar' THEN   -- no permitido para campanas: 409 antes que 422
        PERFORM sp_rev_transicion('campana', v_estado, NULL, 'descartar');
    END IF;
    PERFORM sp_rev_validar_decision(v_editor, NULL, p_id_revisor, p_decision, p_observaciones);
    v_nuevo := sp_rev_transicion('campana', v_estado, NULL, p_decision);

    IF p_decision = 'aprobar' THEN
        IF v_fin IS NULL OR v_fin < current_date THEN
            RAISE EXCEPTION USING ERRCODE = 'RN422',
                MESSAGE = 'No se puede aprobar una campaña cuya fecha de fin ya pasó', DETAIL = 'fecha_fin';
        END IF;
        FOR r IN SELECT id_campana, estado::text AS estado FROM campana_admision
                  WHERE estado IN ('vigente', 'cerrada') AND id_campana <> p_id ORDER BY id_campana FOR UPDATE LOOP
            UPDATE campana_admision SET estado = sp_rev_transicion('campana', r.estado, NULL, 'archivar')::estado_campana
             WHERE id_campana = r.id_campana;
            PERFORM sp_rev_registrar_historial('campana', r.id_campana, 'archivar', r.estado, 'archivada',
                p_id_revisor, format('Reemplazada por la campaña %s', p_id));
        END LOOP;
    END IF;

    UPDATE campana_admision
       SET estado = v_nuevo::estado_campana, id_director_revisa = p_id_revisor, fecha_decision = now(),
           observaciones_revision = NULLIF(btrim(COALESCE(p_observaciones, '')), '')
     WHERE id_campana = p_id;
    PERFORM sp_rev_registrar_historial('campana', p_id, p_decision, v_estado, v_nuevo, p_id_revisor, p_observaciones);
    RETURN v_nuevo;
END;
$$;

-- ---------------------------------------------------------------------
-- sp_campana_cerrar_vencidas: vigente con fecha_fin pasada -> cerrada (tarea S)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_campana_cerrar_vencidas()
RETURNS TABLE (id_campana INT, anio INT, proceso TEXT)
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
AS $$
#variable_conflict use_column
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        WITH upd AS (
            UPDATE campana_admision c
               SET estado = sp_rev_transicion('campana', 'vigente', NULL, 'cerrar')::estado_campana
             WHERE c.estado = 'vigente' AND c.fecha_fin < current_date
            RETURNING c.id_campana, c.anio, c.proceso
        )
        SELECT * FROM upd ORDER BY id_campana
    LOOP
        PERFORM sp_rev_registrar_historial('campana', r.id_campana, 'cerrar', 'vigente', 'cerrada', NULL, NULL);
        id_campana := r.id_campana; anio := r.anio; proceso := r.proceso::text;
        RETURN NEXT;
    END LOOP;
END;
$$;
