-- =====================================================================
-- 14_sp_plan.sql - Procedimientos almacenados del plan de estudios (P6, HU4)
-- DISENO_BACKEND 2.2 (plan), 4.1 (patron de decision) y 4.5.
-- Script de procedimientos almacenados. Idempotente (CREATE OR REPLACE).
--
-- Igual que 10_sp_comunes.sql: sin "SET search_path"; las tablas se
-- resuelven en el schema activo del llamador (public real / pruebas).
--
-- Reglas generales:
--   * Escritura de contenido: rol Editor o Revisor (actuando como editor).
--   * Decision y predeterminado: rol Revisor.
--   * Solo se edita un plan en 'borrador' (transicion 'guardar', RN409 si no).
--     Lo publicado (vigente/historico) NO usa operacion_pendiente: corregirlo
--     = sp_plan_duplicar + revision; al aprobar, el vigente anterior pasa a
--     historico (accion de sistema 'reemplazar', queda en el historial).
--   * id_editor = quien crea / duplica y, despues, quien envia a revision
--     (responsable de la version enviada; el revisor debe ser otro).
--   * El predeterminado es unico (indice parcial uq_plan_predeterminada):
--     siempre se apaga el anterior ANTES de encender el nuevo, bajo un
--     candado de transaccion (pg_advisory_xact_lock) para serializar.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Auxiliar: bloquea el plan (FOR UPDATE), valida el rol del actor y que el
-- plan admita la accion. Devuelve el estado actual del plan.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_plan_bloquear(p_id_usuario INT, p_id_plan INT, p_accion TEXT, p_roles TEXT[])
RETURNS TEXT
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
AS $$
DECLARE
    v_estado TEXT;
BEGIN
    PERFORM sp_rev_assert_rol(p_id_usuario, p_roles);

    SELECT estado::text INTO v_estado
      FROM plan_estudios
     WHERE id_plan = p_id_plan
       FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION USING ERRCODE = 'RN404', MESSAGE = 'Plan de estudios no encontrado', DETAIL = 'id_plan';
    END IF;

    PERFORM sp_rev_transicion('plan', v_estado, NULL, p_accion);
    RETURN v_estado;
END;
$$;

-- ---------------------------------------------------------------------
-- Auxiliar: valida anio (2000..2100) y version (1..20, sin espacios).
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_plan_validar_campos(p_anio INT, p_version TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
IMMUTABLE
AS $$
BEGIN
    IF p_anio IS NULL OR p_anio NOT BETWEEN 2000 AND 2100 THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'El año debe estar entre 2000 y 2100', DETAIL = 'anio';
    END IF;
    IF char_length(btrim(COALESCE(p_version, ''))) = 0 OR char_length(btrim(p_version)) > 20 THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'La versión es obligatoria (máximo 20 caracteres)', DETAIL = 'version';
    END IF;
END;
$$;

-- ---------------------------------------------------------------------
-- Auxiliar: (anio, version) unico -> 23505 con DETAIL 'version'.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_plan_assert_version_libre(p_anio INT, p_version TEXT, p_id_excluir INT)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM plan_estudios
                WHERE anio = p_anio AND version = btrim(p_version)
                  AND id_plan IS DISTINCT FROM p_id_excluir) THEN
        RAISE EXCEPTION USING ERRCODE = 'unique_violation',
            MESSAGE = format('Ya existe el plan %s versión %s', p_anio, btrim(p_version)),
            DETAIL = 'version';
    END IF;
END;
$$;

-- ---------------------------------------------------------------------
-- sp_plan_crear: nuevo borrador. Historial 'guardar' (nuevo -> borrador).
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_plan_crear(p_id_editor INT, p_anio INT, p_version TEXT)
RETURNS INT
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
AS $$
DECLARE
    v_id INT;
BEGIN
    PERFORM sp_rev_assert_rol(p_id_editor, ARRAY['Editor', 'Revisor']);
    PERFORM sp_plan_validar_campos(p_anio, p_version);
    PERFORM sp_plan_assert_version_libre(p_anio, p_version, NULL);

    INSERT INTO plan_estudios (anio, version, estado, es_predeterminada, id_editor)
    VALUES (p_anio, btrim(p_version), 'borrador', FALSE, p_id_editor)
    RETURNING id_plan INTO v_id;

    PERFORM sp_rev_registrar_historial('plan', v_id, 'guardar', NULL, 'borrador', p_id_editor, NULL);
    RETURN v_id;
END;
$$;

-- ---------------------------------------------------------------------
-- sp_plan_actualizar: anio/version, solo en borrador.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_plan_actualizar(p_id_editor INT, p_id INT, p_anio INT, p_version TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
AS $$
BEGIN
    PERFORM sp_plan_bloquear(p_id_editor, p_id, 'guardar', ARRAY['Editor', 'Revisor']);
    PERFORM sp_plan_validar_campos(p_anio, p_version);
    PERFORM sp_plan_assert_version_libre(p_anio, p_version, p_id);

    UPDATE plan_estudios SET anio = p_anio, version = btrim(p_version) WHERE id_plan = p_id;
END;
$$;

-- ---------------------------------------------------------------------
-- sp_plan_adjuntar_pdf: p_tipo 'plan' | 'resolucion'. Devuelve la ruta
-- anterior (para que PHP borre el archivo) o NULL.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_plan_adjuntar_pdf(p_id_editor INT, p_id INT, p_tipo TEXT, p_ruta TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
AS $$
DECLARE
    v_anterior TEXT;
BEGIN
    IF p_tipo IS NULL OR p_tipo NOT IN ('plan', 'resolucion') THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'El tipo de PDF debe ser plan o resolucion', DETAIL = 'tipo';
    END IF;
    IF char_length(btrim(COALESCE(p_ruta, ''))) = 0 OR char_length(p_ruta) > 255 THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'La ruta del archivo no es válida', DETAIL = 'archivo';
    END IF;

    PERFORM sp_plan_bloquear(p_id_editor, p_id, 'guardar', ARRAY['Editor', 'Revisor']);

    IF p_tipo = 'plan' THEN
        SELECT archivo_pdf_plan INTO v_anterior FROM plan_estudios WHERE id_plan = p_id;
        UPDATE plan_estudios SET archivo_pdf_plan = p_ruta WHERE id_plan = p_id;
    ELSE
        SELECT archivo_pdf_resolucion INTO v_anterior FROM plan_estudios WHERE id_plan = p_id;
        UPDATE plan_estudios SET archivo_pdf_resolucion = p_ruta WHERE id_plan = p_id;
    END IF;

    RETURN v_anterior;
END;
$$;

-- ---------------------------------------------------------------------
-- sp_plan_duplicar: borrador nuevo con el mismo anio y p_version; copia los
-- PDF, los cursos y los prerrequisitos (remapeados por codigo). Es la via
-- para corregir un plan ya publicado. El origen puede estar en cualquier estado.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_plan_duplicar(p_id_editor INT, p_id_origen INT, p_version TEXT)
RETURNS INT
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
AS $$
DECLARE
    v_origen plan_estudios%ROWTYPE;
    v_id     INT;
BEGIN
    PERFORM sp_rev_assert_rol(p_id_editor, ARRAY['Editor', 'Revisor']);

    SELECT * INTO v_origen FROM plan_estudios WHERE id_plan = p_id_origen;
    IF NOT FOUND THEN
        RAISE EXCEPTION USING ERRCODE = 'RN404', MESSAGE = 'Plan de estudios no encontrado', DETAIL = 'id_plan';
    END IF;

    PERFORM sp_plan_validar_campos(v_origen.anio, p_version);
    PERFORM sp_plan_assert_version_libre(v_origen.anio, p_version, NULL);

    INSERT INTO plan_estudios (anio, version, estado, es_predeterminada, archivo_pdf_plan, archivo_pdf_resolucion, id_editor)
    VALUES (v_origen.anio, btrim(p_version), 'borrador', FALSE, v_origen.archivo_pdf_plan, v_origen.archivo_pdf_resolucion, p_id_editor)
    RETURNING id_plan INTO v_id;

    INSERT INTO curso (id_plan, codigo, nombre, creditos, tipo, ciclo, area_formacion, horas_teoria, horas_practica, descripcion)
    SELECT v_id, codigo, nombre, creditos, tipo, ciclo, area_formacion, horas_teoria, horas_practica, descripcion
      FROM curso
     WHERE id_plan = p_id_origen;

    INSERT INTO prerrequisito (id_curso, id_curso_requerido)
    SELECT nc.id_curso, nr.id_curso
      FROM prerrequisito p
      JOIN curso oc ON oc.id_curso = p.id_curso AND oc.id_plan = p_id_origen
      JOIN curso orq ON orq.id_curso = p.id_curso_requerido
      JOIN curso nc ON nc.id_plan = v_id AND nc.codigo = oc.codigo
      JOIN curso nr ON nr.id_plan = v_id AND nr.codigo = orq.codigo;

    PERFORM sp_rev_registrar_historial('plan', v_id, 'guardar', NULL, 'borrador', p_id_editor,
        format('Duplicado del plan %s versión %s', v_origen.anio, v_origen.version));
    RETURN v_id;
END;
$$;

-- ---------------------------------------------------------------------
-- Auxiliar: valida los campos de un curso. p_prefijo antepone el campo del
-- DETAIL (p. ej. 'cursos[3].' en la importacion masiva).
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_curso_validar_campos(
    p_codigo TEXT, p_nombre TEXT, p_creditos INT, p_tipo TEXT, p_ciclo INT,
    p_area TEXT, p_horas_t INT, p_horas_p INT, p_descripcion TEXT, p_prefijo TEXT DEFAULT '')
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
IMMUTABLE
AS $$
DECLARE
    v_pre TEXT := COALESCE(p_prefijo, '');
BEGIN
    IF char_length(btrim(COALESCE(p_codigo, ''))) = 0 OR char_length(btrim(p_codigo)) > 20
       OR btrim(p_codigo) ~ '\s' THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'El código es obligatorio, sin espacios y de máximo 20 caracteres', DETAIL = v_pre || 'codigo';
    END IF;
    IF char_length(btrim(COALESCE(p_nombre, ''))) = 0 OR char_length(btrim(p_nombre)) > 150 THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'El nombre es obligatorio (máximo 150 caracteres)', DETAIL = v_pre || 'nombre';
    END IF;
    IF p_creditos IS NULL OR p_creditos NOT BETWEEN 1 AND 10 THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'Los créditos deben estar entre 1 y 10', DETAIL = v_pre || 'creditos';
    END IF;
    IF p_tipo IS NULL OR p_tipo NOT IN ('obligatorio', 'electivo') THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'El tipo debe ser obligatorio o electivo', DETAIL = v_pre || 'tipo';
    END IF;
    IF p_ciclo IS NULL OR p_ciclo NOT BETWEEN 1 AND 10 THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'El ciclo debe estar entre 1 y 10', DETAIL = v_pre || 'ciclo';
    END IF;
    IF p_area IS NULL OR p_area NOT IN ('general', 'especifico', 'especialidad') THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'El área de formación debe ser general, especifico o especialidad', DETAIL = v_pre || 'area_formacion';
    END IF;
    IF p_horas_t IS NULL OR p_horas_t NOT BETWEEN 0 AND 10 THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'Las horas de teoría deben estar entre 0 y 10', DETAIL = v_pre || 'horas_teoria';
    END IF;
    IF p_horas_p IS NULL OR p_horas_p NOT BETWEEN 0 AND 10 THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'Las horas de práctica deben estar entre 0 y 10', DETAIL = v_pre || 'horas_practica';
    END IF;
    IF char_length(COALESCE(p_descripcion, '')) > 500 THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'La descripción no puede superar 500 caracteres', DETAIL = v_pre || 'descripcion';
    END IF;
END;
$$;

-- ---------------------------------------------------------------------
-- sp_curso_guardar: crea (p_id_curso NULL) o actualiza un curso del plan en
-- borrador. Codigo unico dentro del plan (23505, DETAIL 'codigo').
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_curso_guardar(
    p_id_editor INT, p_id_plan INT, p_id_curso INT, p_codigo TEXT, p_nombre TEXT, p_creditos INT,
    p_tipo TEXT, p_ciclo INT, p_area TEXT, p_horas_t INT, p_horas_p INT, p_descripcion TEXT)
RETURNS INT
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
AS $$
DECLARE
    v_id     INT;
    v_codigo TEXT := btrim(p_codigo);
BEGIN
    PERFORM sp_plan_bloquear(p_id_editor, p_id_plan, 'guardar', ARRAY['Editor', 'Revisor']);
    PERFORM sp_curso_validar_campos(p_codigo, p_nombre, p_creditos, p_tipo, p_ciclo, p_area, p_horas_t, p_horas_p, p_descripcion);

    IF p_id_curso IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM curso WHERE id_curso = p_id_curso AND id_plan = p_id_plan) THEN
        RAISE EXCEPTION USING ERRCODE = 'RN404', MESSAGE = 'Curso no encontrado en el plan', DETAIL = 'id_curso';
    END IF;

    IF EXISTS (SELECT 1 FROM curso WHERE id_plan = p_id_plan AND codigo = v_codigo
                 AND id_curso IS DISTINCT FROM p_id_curso) THEN
        RAISE EXCEPTION USING ERRCODE = 'unique_violation',
            MESSAGE = format('Ya existe un curso con el código %s en este plan', v_codigo),
            DETAIL = 'codigo';
    END IF;

    IF p_id_curso IS NULL THEN
        INSERT INTO curso (id_plan, codigo, nombre, creditos, tipo, ciclo, area_formacion, horas_teoria, horas_practica, descripcion)
        VALUES (p_id_plan, v_codigo, btrim(p_nombre), p_creditos, p_tipo::tipo_curso, p_ciclo, p_area,
                p_horas_t, p_horas_p, NULLIF(btrim(COALESCE(p_descripcion, '')), ''))
        RETURNING id_curso INTO v_id;
    ELSE
        UPDATE curso
           SET codigo = v_codigo, nombre = btrim(p_nombre), creditos = p_creditos, tipo = p_tipo::tipo_curso,
               ciclo = p_ciclo, area_formacion = p_area, horas_teoria = p_horas_t, horas_practica = p_horas_p,
               descripcion = NULLIF(btrim(COALESCE(p_descripcion, '')), '')
         WHERE id_curso = p_id_curso;
        v_id := p_id_curso;
    END IF;

    RETURN v_id;
END;
$$;

-- ---------------------------------------------------------------------
-- sp_curso_eliminar: plan en borrador; borra antes los prerrequisitos
-- donde aparece el curso (en ambos sentidos).
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_curso_eliminar(p_id_editor INT, p_id_curso INT)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
AS $$
DECLARE
    v_plan INT;
BEGIN
    SELECT id_plan INTO v_plan FROM curso WHERE id_curso = p_id_curso;
    IF NOT FOUND THEN
        RAISE EXCEPTION USING ERRCODE = 'RN404', MESSAGE = 'Curso no encontrado', DETAIL = 'id_curso';
    END IF;

    PERFORM sp_plan_bloquear(p_id_editor, v_plan, 'guardar', ARRAY['Editor', 'Revisor']);

    DELETE FROM prerrequisito WHERE id_curso = p_id_curso OR id_curso_requerido = p_id_curso;
    DELETE FROM curso WHERE id_curso = p_id_curso;
END;
$$;

-- ---------------------------------------------------------------------
-- sp_curso_importar: upsert por codigo de un arreglo JSONB (maximo 120)
-- con las claves del API: codigo, nombre, creditos, tipo, ciclo,
-- area_formacion, horas_teoria, horas_practica, descripcion.
-- Una fila invalida aborta todo (RN422, DETAIL 'cursos[i].campo', i desde 0).
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_curso_importar(p_id_editor INT, p_id_plan INT, p_cursos JSONB)
RETURNS INT
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
AS $$
DECLARE
    v_fila   JSONB;
    v_i      INT;
    v_pre    TEXT;
    v_codigo TEXT;
    v_vistos TEXT[] := ARRAY[]::TEXT[];
    v_cred   INT;
    v_ciclo  INT;
    v_ht     INT;
    v_hp     INT;
BEGIN
    PERFORM sp_plan_bloquear(p_id_editor, p_id_plan, 'guardar', ARRAY['Editor', 'Revisor']);

    IF p_cursos IS NULL OR jsonb_typeof(p_cursos) <> 'array' OR jsonb_array_length(p_cursos) = 0 THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'Debe enviar al menos un curso', DETAIL = 'cursos';
    END IF;
    IF jsonb_array_length(p_cursos) > 120 THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'Se pueden importar como máximo 120 cursos', DETAIL = 'cursos';
    END IF;

    FOR v_fila, v_i IN SELECT e.valor, (e.ord - 1)::int FROM jsonb_array_elements(p_cursos) WITH ORDINALITY AS e(valor, ord) LOOP
        v_pre := format('cursos[%s].', v_i);

        IF jsonb_typeof(v_fila) <> 'object' THEN
            RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'Cada curso debe ser un objeto', DETAIL = format('cursos[%s]', v_i);
        END IF;

        BEGIN
            v_cred  := (v_fila ->> 'creditos')::int;
        EXCEPTION WHEN others THEN
            RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'Los créditos deben ser un número entero', DETAIL = v_pre || 'creditos';
        END;
        BEGIN
            v_ciclo := (v_fila ->> 'ciclo')::int;
        EXCEPTION WHEN others THEN
            RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'El ciclo debe ser un número entero', DETAIL = v_pre || 'ciclo';
        END;
        BEGIN
            v_ht := COALESCE((v_fila ->> 'horas_teoria')::int, 0);
        EXCEPTION WHEN others THEN
            RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'Las horas de teoría deben ser un número entero', DETAIL = v_pre || 'horas_teoria';
        END;
        BEGIN
            v_hp := COALESCE((v_fila ->> 'horas_practica')::int, 0);
        EXCEPTION WHEN others THEN
            RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'Las horas de práctica deben ser un número entero', DETAIL = v_pre || 'horas_practica';
        END;

        PERFORM sp_curso_validar_campos(v_fila ->> 'codigo', v_fila ->> 'nombre', v_cred,
            COALESCE(v_fila ->> 'tipo', 'obligatorio'), v_ciclo, v_fila ->> 'area_formacion',
            v_ht, v_hp, v_fila ->> 'descripcion', v_pre);

        v_codigo := btrim(v_fila ->> 'codigo');
        IF v_codigo = ANY (v_vistos) THEN
            RAISE EXCEPTION USING ERRCODE = 'RN422',
                MESSAGE = format('El código %s está repetido en la importación', v_codigo),
                DETAIL = v_pre || 'codigo';
        END IF;
        v_vistos := v_vistos || v_codigo;

        INSERT INTO curso (id_plan, codigo, nombre, creditos, tipo, ciclo, area_formacion, horas_teoria, horas_practica, descripcion)
        VALUES (p_id_plan, v_codigo, btrim(v_fila ->> 'nombre'), v_cred,
                COALESCE(v_fila ->> 'tipo', 'obligatorio')::tipo_curso, v_ciclo, v_fila ->> 'area_formacion',
                v_ht, v_hp, NULLIF(btrim(COALESCE(v_fila ->> 'descripcion', '')), ''))
        ON CONFLICT (id_plan, codigo) DO UPDATE
           SET nombre = EXCLUDED.nombre, creditos = EXCLUDED.creditos, tipo = EXCLUDED.tipo,
               ciclo = EXCLUDED.ciclo, area_formacion = EXCLUDED.area_formacion,
               horas_teoria = EXCLUDED.horas_teoria, horas_practica = EXCLUDED.horas_practica,
               descripcion = EXCLUDED.descripcion;
    END LOOP;

    RETURN jsonb_array_length(p_cursos);
END;
$$;

-- ---------------------------------------------------------------------
-- sp_plan_detectar_ciclo: NULL si el grafo de prerrequisitos del plan es
-- aciclico; si no, la ruta de codigos del ciclo mas corto encontrado,
-- p. ej. 'A → B → A' (A requiere B y B requiere A). La ruta se recorta
-- para empezar en el curso que cierra el ciclo (sin el tramo de entrada).
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_plan_detectar_ciclo(p_id_plan INT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
AS $$
DECLARE
    v_ruta_ids INT[];
    v_inicio   INT;
    v_ruta     TEXT;
BEGIN
    WITH RECURSIVE camino(origen, actual, ruta, ciclo) AS (
        SELECT p.id_curso, p.id_curso_requerido, ARRAY[p.id_curso, p.id_curso_requerido],
               p.id_curso = p.id_curso_requerido
          FROM prerrequisito p
          JOIN curso c ON c.id_curso = p.id_curso
         WHERE c.id_plan = p_id_plan
        UNION ALL
        SELECT c.origen, p.id_curso_requerido, c.ruta || p.id_curso_requerido,
               p.id_curso_requerido = ANY (c.ruta)
          FROM camino c
          JOIN prerrequisito p ON p.id_curso = c.actual
         WHERE NOT c.ciclo
    )
    SELECT ruta INTO v_ruta_ids
      FROM camino
     WHERE ciclo
     ORDER BY cardinality(ruta), ruta
     LIMIT 1;

    IF v_ruta_ids IS NULL THEN
        RETURN NULL;
    END IF;

    -- recorta el tramo de entrada: desde la primera aparicion del nodo repetido
    v_inicio := array_position(v_ruta_ids, v_ruta_ids[cardinality(v_ruta_ids)]);
    v_ruta_ids := v_ruta_ids[v_inicio:cardinality(v_ruta_ids)];

    SELECT string_agg(cu.codigo, ' → ' ORDER BY u.ord)
      INTO v_ruta
      FROM unnest(v_ruta_ids) WITH ORDINALITY AS u(id, ord)
      JOIN curso cu ON cu.id_curso = u.id;

    RETURN v_ruta;
END;
$$;

-- ---------------------------------------------------------------------
-- sp_curso_establecer_prerrequisitos: reemplaza el conjunto de requeridos
-- del curso (plan en borrador). Despues verifica ciclos: si hay, RN422
-- 'Prerrequisito circular: A → B → A' (DETAIL 'prerrequisitos') y la
-- transaccion se revierte.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_curso_establecer_prerrequisitos(p_id_editor INT, p_id_curso INT, p_ids_requeridos INT[])
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
AS $$
DECLARE
    v_plan  INT;
    v_ids   INT[];
    v_ruta  TEXT;
BEGIN
    SELECT id_plan INTO v_plan FROM curso WHERE id_curso = p_id_curso;
    IF NOT FOUND THEN
        RAISE EXCEPTION USING ERRCODE = 'RN404', MESSAGE = 'Curso no encontrado', DETAIL = 'id_curso';
    END IF;

    PERFORM sp_plan_bloquear(p_id_editor, v_plan, 'guardar', ARRAY['Editor', 'Revisor']);

    IF p_ids_requeridos IS NOT NULL AND array_position(p_ids_requeridos, NULL) IS NOT NULL THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'Hay prerrequisitos vacíos', DETAIL = 'prerrequisitos';
    END IF;

    SELECT COALESCE(array_agg(DISTINCT x), ARRAY[]::INT[]) INTO v_ids FROM unnest(p_ids_requeridos) AS x;

    IF p_id_curso = ANY (v_ids) THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'Un curso no puede ser prerrequisito de sí mismo', DETAIL = 'prerrequisitos';
    END IF;

    IF EXISTS (SELECT 1 FROM unnest(v_ids) AS x
                WHERE NOT EXISTS (SELECT 1 FROM curso c WHERE c.id_curso = x AND c.id_plan = v_plan)) THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'Todos los prerrequisitos deben ser cursos del mismo plan', DETAIL = 'prerrequisitos';
    END IF;

    DELETE FROM prerrequisito WHERE id_curso = p_id_curso;
    INSERT INTO prerrequisito (id_curso, id_curso_requerido)
    SELECT p_id_curso, x FROM unnest(v_ids) AS x;

    v_ruta := sp_plan_detectar_ciclo(v_plan);
    IF v_ruta IS NOT NULL THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422',
            MESSAGE = 'Prerrequisito circular: ' || v_ruta,
            DETAIL = 'prerrequisitos';
    END IF;
END;
$$;

-- ---------------------------------------------------------------------
-- sp_plan_validar: estructura del plan. nivel 'error' | 'advertencia';
-- codigo = clave estable de la regla (para el cliente/pruebas):
--   errores: SIN_CURSOS, CICLOS_NO_CONTIGUOS, CICLO_SIN_CREDITOS,
--            PRERREQUISITO_CIRCULAR, FALTA_PDF_PLAN, FALTA_PDF_RESOLUCION
--   advertencias: CREDITOS_CICLO (fuera de 18..26), PRERREQUISITO_CICLO
--            (el requerido esta en un ciclo >= al del curso).
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_plan_validar(p_id_plan INT)
RETURNS TABLE(nivel TEXT, codigo TEXT, mensaje TEXT)
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
AS $$
DECLARE
    v_plan  plan_estudios%ROWTYPE;
    v_max   INT;
    v_falta TEXT;
    v_ruta  TEXT;
BEGIN
    SELECT * INTO v_plan FROM plan_estudios WHERE id_plan = p_id_plan;
    IF NOT FOUND THEN
        RAISE EXCEPTION USING ERRCODE = 'RN404', MESSAGE = 'Plan de estudios no encontrado', DETAIL = 'id_plan';
    END IF;

    SELECT max(c.ciclo) INTO v_max FROM curso c WHERE c.id_plan = p_id_plan;

    IF v_max IS NULL THEN
        RETURN QUERY SELECT 'error'::text, 'SIN_CURSOS'::text, 'El plan no tiene cursos'::text;
    ELSE
        SELECT string_agg(g::text, ', ' ORDER BY g) INTO v_falta
          FROM generate_series(1, v_max) AS g
         WHERE NOT EXISTS (SELECT 1 FROM curso c WHERE c.id_plan = p_id_plan AND c.ciclo = g);
        IF v_falta IS NOT NULL THEN
            RETURN QUERY SELECT 'error'::text, 'CICLOS_NO_CONTIGUOS'::text,
                format('Faltan cursos en los ciclos: %s (el plan llega al ciclo %s)', v_falta, v_max);
        END IF;

        RETURN QUERY
            SELECT 'error'::text, 'CICLO_SIN_CREDITOS'::text, format('El ciclo %s suma 0 créditos', c.ciclo)
              FROM curso c WHERE c.id_plan = p_id_plan
             GROUP BY c.ciclo HAVING sum(c.creditos) = 0
             ORDER BY c.ciclo;
    END IF;

    v_ruta := sp_plan_detectar_ciclo(p_id_plan);
    IF v_ruta IS NOT NULL THEN
        RETURN QUERY SELECT 'error'::text, 'PRERREQUISITO_CIRCULAR'::text, 'Prerrequisito circular: ' || v_ruta;
    END IF;

    IF v_plan.archivo_pdf_plan IS NULL OR btrim(v_plan.archivo_pdf_plan) = '' THEN
        RETURN QUERY SELECT 'error'::text, 'FALTA_PDF_PLAN'::text, 'Falta el PDF del plan de estudios'::text;
    END IF;
    IF v_plan.archivo_pdf_resolucion IS NULL OR btrim(v_plan.archivo_pdf_resolucion) = '' THEN
        RETURN QUERY SELECT 'error'::text, 'FALTA_PDF_RESOLUCION'::text, 'Falta el PDF de la resolución de aprobación'::text;
    END IF;

    RETURN QUERY
        SELECT 'advertencia'::text, 'CREDITOS_CICLO'::text,
               format('El ciclo %s suma %s créditos (se esperan entre 18 y 26)', c.ciclo, sum(c.creditos))
          FROM curso c WHERE c.id_plan = p_id_plan
         GROUP BY c.ciclo HAVING sum(c.creditos) NOT BETWEEN 18 AND 26
         ORDER BY c.ciclo;

    RETURN QUERY
        SELECT 'advertencia'::text, 'PRERREQUISITO_CICLO'::text,
               format('%s (ciclo %s) requiere %s, que está en el ciclo %s', c.codigo, c.ciclo, r.codigo, r.ciclo)
          FROM prerrequisito p
          JOIN curso c ON c.id_curso = p.id_curso AND c.id_plan = p_id_plan
          JOIN curso r ON r.id_curso = p.id_curso_requerido
         WHERE r.ciclo >= c.ciclo
         ORDER BY c.ciclo, c.codigo, r.codigo;
END;
$$;

-- ---------------------------------------------------------------------
-- sp_plan_enviar_revision: borrador -> en_revision si sp_plan_validar no
-- tiene errores (RN422 'El plan tiene N errores de validación', DETAIL
-- 'validacion'). El que envia queda como id_editor.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_plan_enviar_revision(p_id_editor INT, p_id INT)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
AS $$
DECLARE
    v_estado  TEXT;
    v_nuevo   TEXT;
    v_errores INT;
BEGIN
    v_estado := sp_plan_bloquear(p_id_editor, p_id, 'enviar_revision', ARRAY['Editor', 'Revisor']);
    v_nuevo := sp_rev_transicion('plan', v_estado, NULL, 'enviar_revision');

    SELECT count(*)::int INTO v_errores FROM sp_plan_validar(p_id) v WHERE v.nivel = 'error';
    IF v_errores > 0 THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422',
            MESSAGE = format('El plan tiene %s errores de validación', v_errores),
            DETAIL = 'validacion';
    END IF;

    UPDATE plan_estudios
       SET estado = v_nuevo::estado_plan,
           id_editor = p_id_editor,
           -- ck_plan_estudios_revisor: si quien observo ahora envia, se libera el revisor anterior
           id_director_revisa = NULLIF(id_director_revisa, p_id_editor)
     WHERE id_plan = p_id;

    PERFORM sp_rev_registrar_historial('plan', p_id, 'enviar_revision', v_estado, v_nuevo, p_id_editor, NULL);
END;
$$;

-- ---------------------------------------------------------------------
-- Auxiliar: apaga el predeterminado actual (si es otro) y enciende p_id.
-- Respeta el indice unico parcial: primero FALSE, despues TRUE.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_plan_fijar_predeterminado_interno(p_id INT)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
AS $$
BEGIN
    PERFORM pg_advisory_xact_lock(hashtext('plan_estudios.es_predeterminada'));
    UPDATE plan_estudios SET es_predeterminada = FALSE WHERE es_predeterminada AND id_plan <> p_id;
    UPDATE plan_estudios SET es_predeterminada = TRUE WHERE id_plan = p_id AND NOT es_predeterminada;
END;
$$;

-- ---------------------------------------------------------------------
-- sp_plan_decidir: patron 4.1. Devuelve el estado nuevo.
--   aprobar + como_vigente (por defecto): todo otro 'vigente' -> 'historico'
--     (historial 'reemplazar'), este pasa a 'vigente' y queda como unico
--     predeterminado; fecha_publicacion = now().
--   aprobar sin como_vigente: 'historico' (consultable), fecha_publicacion = now().
--   observar -> borrador; descartar -> descartado (p_como_vigente se ignora).
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_plan_decidir(
    p_id_revisor INT, p_id INT, p_decision TEXT, p_observaciones TEXT, p_como_vigente BOOL DEFAULT TRUE)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
AS $$
DECLARE
    v_estado  TEXT;
    v_editor  INT;
    v_nuevo   TEXT;
    v_plan    RECORD;
    v_obs     TEXT := NULLIF(btrim(COALESCE(p_observaciones, '')), '');
    v_etiqueta TEXT;
BEGIN
    SELECT estado::text, id_editor, 'Plan ' || anio || ' v' || version
      INTO v_estado, v_editor, v_etiqueta
      FROM plan_estudios WHERE id_plan = p_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION USING ERRCODE = 'RN404', MESSAGE = 'Plan de estudios no encontrado', DETAIL = 'id_plan';
    END IF;

    PERFORM sp_rev_assert_rol(p_id_revisor, ARRAY['Revisor']);
    PERFORM sp_rev_validar_decision(v_editor, NULL, p_id_revisor, p_decision, p_observaciones);
    v_nuevo := sp_rev_transicion('plan', v_estado, NULL, p_decision);

    IF p_decision = 'aprobar' THEN
        IF COALESCE(p_como_vigente, TRUE) THEN
            PERFORM pg_advisory_xact_lock(hashtext('plan_estudios.es_predeterminada'));
            FOR v_plan IN
                SELECT id_plan FROM plan_estudios
                 WHERE estado = 'vigente' AND id_plan <> p_id
                 ORDER BY id_plan
                   FOR UPDATE
            LOOP
                UPDATE plan_estudios
                   SET estado = sp_rev_transicion('plan', 'vigente', NULL, 'reemplazar')::estado_plan
                 WHERE id_plan = v_plan.id_plan;
                PERFORM sp_rev_registrar_historial('plan', v_plan.id_plan, 'reemplazar', 'vigente', 'historico',
                    p_id_revisor, 'Reemplazado por ' || v_etiqueta);
            END LOOP;
            v_nuevo := 'vigente';
        ELSE
            v_nuevo := 'historico';
        END IF;
    END IF;

    UPDATE plan_estudios
       SET estado = v_nuevo::estado_plan,
           id_director_revisa = p_id_revisor,
           fecha_decision = now(),
           observaciones_revision = v_obs,
           fecha_publicacion = CASE WHEN p_decision = 'aprobar' THEN now() ELSE fecha_publicacion END
     WHERE id_plan = p_id;

    IF p_decision = 'aprobar' AND v_nuevo = 'vigente' THEN
        PERFORM sp_plan_fijar_predeterminado_interno(p_id);
    END IF;

    PERFORM sp_rev_registrar_historial('plan', p_id, p_decision, v_estado, v_nuevo, p_id_revisor, v_obs);
    RETURN v_nuevo;
END;
$$;

-- ---------------------------------------------------------------------
-- sp_plan_establecer_predeterminado: Revisor; plan vigente o historico
-- (RN409 si no). Unico predeterminado, de forma atomica. Historial
-- 'establecer_predeterminado' (sin cambio de estado).
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_plan_establecer_predeterminado(p_id_revisor INT, p_id INT)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
AS $$
DECLARE
    v_estado TEXT;
BEGIN
    v_estado := sp_plan_bloquear(p_id_revisor, p_id, 'establecer_predeterminado', ARRAY['Revisor']);
    PERFORM sp_plan_fijar_predeterminado_interno(p_id);
    PERFORM sp_rev_registrar_historial('plan', p_id, 'establecer_predeterminado', v_estado, v_estado, p_id_revisor, NULL);
END;
$$;

-- ---------------------------------------------------------------------
-- Consultas publicas (lectura). La vista v_publico_planes (20_vistas.sql)
-- expone lo mismo; estas funciones sirven al backend sin depender de ella.
-- sp_plan_publicos: versiones 'vigente' + 'historico', el predeterminado
-- primero y luego por anio/version descendente.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_plan_publicos()
RETURNS TABLE(id_plan INT, anio INT, version TEXT, estado TEXT, es_predeterminada BOOLEAN,
              archivo_pdf_plan TEXT, archivo_pdf_resolucion TEXT, fecha_publicacion TIMESTAMP)
LANGUAGE sql
SECURITY INVOKER
STABLE
AS $$
    SELECT p.id_plan, p.anio, p.version::text, p.estado::text, p.es_predeterminada,
           p.archivo_pdf_plan::text, p.archivo_pdf_resolucion::text, p.fecha_publicacion
      FROM plan_estudios p
     WHERE p.estado IN ('vigente', 'historico')
     ORDER BY p.es_predeterminada DESC, p.anio DESC, p.version DESC;
$$;

-- ---------------------------------------------------------------------
-- sp_plan_predeterminado: id del plan publico que se muestra al entrar:
-- el predeterminado (vigente/historico); si no hay, el vigente mas
-- reciente; si no, NULL.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_plan_predeterminado()
RETURNS INT
LANGUAGE sql
SECURITY INVOKER
STABLE
AS $$
    SELECT p.id_plan
      FROM plan_estudios p
     WHERE p.estado IN ('vigente', 'historico')
       AND (p.es_predeterminada OR p.estado = 'vigente')
     ORDER BY p.es_predeterminada DESC, p.fecha_publicacion DESC NULLS LAST, p.id_plan DESC
     LIMIT 1;
$$;
