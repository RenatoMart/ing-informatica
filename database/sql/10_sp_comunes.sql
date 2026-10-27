-- =====================================================================
-- 10_sp_comunes.sql - Procedimientos almacenados comunes (DISENO_BACKEND 2.2, 4.1)
-- Script de procedimientos almacenados. Idempotente (CREATE OR REPLACE).
--
-- Nota de esquema: las funciones NO fijan "SET search_path = public"; se crean
-- y resuelven sus tablas en el schema activo del llamador (public en real,
-- pruebas en el entorno de pruebas). Asi las pruebas nunca tocan public.
--
-- Errores propios (4.0): RN403 acceso, RN404 no encontrado, RN409 estado,
-- RN422 regla de negocio (DETAIL = campo).
-- =====================================================================

-- ---------------------------------------------------------------------
-- sp_rev_assert_rol: el usuario existe, esta activo y su rol esta en p_roles.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_rev_assert_rol(p_id_usuario INT, p_roles TEXT[])
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
AS $$
DECLARE
    v_rol    TEXT;
    v_estado TEXT;
BEGIN
    SELECT r.nombre, u.estado::text
      INTO v_rol, v_estado
      FROM usuario u
      JOIN rol r ON r.id_rol = u.id_rol
     WHERE u.id_usuario = p_id_usuario;

    IF NOT FOUND OR v_estado <> 'activo' OR NOT (v_rol = ANY (p_roles)) THEN
        RAISE EXCEPTION USING ERRCODE = 'RN403',
            MESSAGE = 'No tiene permisos para realizar esta acción',
            DETAIL = 'rol';
    END IF;
END;
$$;

-- ---------------------------------------------------------------------
-- sp_rev_transicion: tabla de transiciones 2.2 (fuente unica, espejo de
-- Dominio\Revision\MaquinaEstadosRevision). p_estado NULL = registro nuevo.
-- p_operacion NULL/'' = sin operacion pendiente ('cambio' | 'baja').
-- Acciones de sistema [EXTRA] para el historial de la version desplazada:
--   plan vigente -reemplazar-> historico; documento vigente|vencido
--   -reemplazar-> historico; campana vigente|cerrada -archivar-> archivada.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_rev_transicion(p_entidad TEXT, p_estado TEXT, p_operacion TEXT, p_accion TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY INVOKER
IMMUTABLE
AS $$
DECLARE
    v_estado TEXT := NULLIF(btrim(COALESCE(p_estado, '')), '');
    v_op     TEXT := NULLIF(btrim(COALESCE(p_operacion, '')), '');
    v_clave  TEXT;
    v_nuevo  TEXT;
BEGIN
    v_clave := COALESCE(v_estado, '(nuevo)') || '|' || COALESCE(v_op, '-') || '|' || COALESCE(p_accion, '');

    CASE p_entidad
    WHEN 'publicacion' THEN
        v_nuevo := CASE v_clave
            WHEN '(nuevo)|-|guardar'               THEN 'borrador'
            WHEN 'borrador|-|guardar'              THEN 'borrador'
            WHEN 'borrador|-|enviar_revision'      THEN 'en_revision'
            WHEN 'borrador|-|descartar'            THEN 'descartada'
            WHEN 'en_revision|-|aprobar'           THEN 'publicada'
            WHEN 'en_revision|-|observar'          THEN 'borrador'
            WHEN 'en_revision|-|descartar'         THEN 'descartada'
            WHEN 'publicada|-|proponer_cambio'     THEN 'publicada'
            WHEN 'publicada|cambio|proponer_cambio' THEN 'publicada'
            WHEN 'publicada|-|solicitar_baja'      THEN 'publicada'
            WHEN 'publicada|cambio|aprobar'        THEN 'publicada'
            WHEN 'publicada|baja|aprobar'          THEN 'despublicada'
            WHEN 'publicada|cambio|observar'       THEN 'publicada'
            WHEN 'publicada|cambio|descartar'      THEN 'publicada'
            WHEN 'publicada|baja|observar'         THEN 'publicada'
            WHEN 'publicada|baja|descartar'        THEN 'publicada'
        END;
    WHEN 'docente' THEN
        v_nuevo := CASE v_clave
            WHEN '(nuevo)|-|guardar'               THEN 'borrador'
            WHEN 'borrador|-|guardar'              THEN 'borrador'
            WHEN 'borrador|-|enviar_revision'      THEN 'en_revision'
            WHEN 'en_revision|-|aprobar'           THEN 'publicado'
            WHEN 'en_revision|-|observar'          THEN 'borrador'
            WHEN 'publicado|-|proponer_cambio'     THEN 'publicado'
            WHEN 'publicado|cambio|proponer_cambio' THEN 'publicado'
            WHEN 'publicado|-|solicitar_baja'      THEN 'publicado'
            WHEN 'publicado|cambio|aprobar'        THEN 'publicado'
            WHEN 'publicado|baja|aprobar'          THEN 'inactivo'
            WHEN 'publicado|cambio|observar'       THEN 'publicado'
            WHEN 'publicado|baja|observar'         THEN 'publicado'
            WHEN 'inactivo|-|reactivar'            THEN 'borrador'
        END;
    WHEN 'plan' THEN
        -- aprobar devuelve 'vigente'; con como_vigente = FALSE, sp_plan_decidir usa 'historico'.
        v_nuevo := CASE v_clave
            WHEN '(nuevo)|-|guardar'                     THEN 'borrador'
            WHEN 'borrador|-|guardar'                    THEN 'borrador'
            WHEN 'borrador|-|enviar_revision'            THEN 'en_revision'
            WHEN 'en_revision|-|aprobar'                 THEN 'vigente'
            WHEN 'en_revision|-|observar'                THEN 'borrador'
            WHEN 'en_revision|-|descartar'               THEN 'descartado'
            WHEN 'vigente|-|establecer_predeterminado'   THEN 'vigente'
            WHEN 'historico|-|establecer_predeterminado' THEN 'historico'
            WHEN 'vigente|-|reemplazar'                  THEN 'historico'
        END;
    WHEN 'documento' THEN
        v_nuevo := CASE v_clave
            WHEN '(nuevo)|-|guardar'          THEN 'en_revision'
            WHEN 'en_revision|-|aprobar'      THEN 'vigente'
            WHEN 'en_revision|-|observar'     THEN 'no_publicado'
            WHEN 'en_revision|-|descartar'    THEN 'no_publicado'
            WHEN 'no_publicado|-|guardar'     THEN 'no_publicado'
            WHEN 'no_publicado|-|reenviar'    THEN 'en_revision'
            WHEN 'vigente|-|vencer'           THEN 'vencido'
            WHEN 'vigente|-|reemplazar'       THEN 'historico'
            WHEN 'vencido|-|reemplazar'       THEN 'historico'
        END;
    WHEN 'campana' THEN
        v_nuevo := CASE v_clave
            WHEN '(nuevo)|-|guardar'          THEN 'borrador'
            WHEN 'borrador|-|guardar'         THEN 'borrador'
            WHEN 'borrador|-|enviar_revision' THEN 'en_revision'
            WHEN 'en_revision|-|aprobar'      THEN 'vigente'
            WHEN 'en_revision|-|observar'     THEN 'borrador'
            WHEN 'vigente|-|cerrar'           THEN 'cerrada'
            WHEN 'vigente|-|archivar'         THEN 'archivada'
            WHEN 'cerrada|-|archivar'         THEN 'archivada'
        END;
    ELSE
        RAISE EXCEPTION USING ERRCODE = 'RN422',
            MESSAGE = format('Entidad de revisión desconocida: %s', COALESCE(p_entidad, '(nula)')),
            DETAIL = 'entidad';
    END CASE;

    IF v_nuevo IS NULL THEN
        RAISE EXCEPTION USING ERRCODE = 'RN409',
            MESSAGE = format('Acción no permitida en estado %s',
                             COALESCE(v_estado, '(nuevo)') || COALESCE(' (' || v_op || ')', '')),
            DETAIL = 'estado';
    END IF;

    RETURN v_nuevo;
END;
$$;

-- ---------------------------------------------------------------------
-- sp_rev_validar_decision: decision valida, revisor distinto del editor (y del
-- editor del cambio pendiente), observaciones obligatorias si no se aprueba.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_rev_validar_decision(
    p_id_editor INT, p_id_editor_cambio INT, p_id_revisor INT, p_decision TEXT, p_observaciones TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
IMMUTABLE
AS $$
DECLARE
    v_obs TEXT := btrim(COALESCE(p_observaciones, ''));
BEGIN
    IF p_decision IS NULL OR p_decision NOT IN ('aprobar', 'observar', 'descartar') THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422',
            MESSAGE = 'La decisión debe ser aprobar, observar o descartar',
            DETAIL = 'decision';
    END IF;

    IF p_id_revisor IS NULL
       OR p_id_revisor = p_id_editor
       OR p_id_revisor = p_id_editor_cambio THEN
        RAISE EXCEPTION USING ERRCODE = 'RN403',
            MESSAGE = 'No puede revisar contenido que usted editó',
            DETAIL = 'id_director_revisa';
    END IF;

    IF p_decision <> 'aprobar' AND char_length(v_obs) < 5 THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422',
            MESSAGE = 'Las observaciones son obligatorias (5 a 500 caracteres)',
            DETAIL = 'observaciones';
    END IF;

    IF char_length(v_obs) > 500 THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422',
            MESSAGE = 'Las observaciones no pueden superar 500 caracteres',
            DETAIL = 'observaciones';
    END IF;
END;
$$;

-- ---------------------------------------------------------------------
-- sp_rev_registrar_historial: una fila por transicion [EXTRA historial_revision].
-- p_id_usuario NULL = sistema (tarea programada).
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_rev_registrar_historial(
    p_entidad TEXT, p_id_registro INT, p_accion TEXT, p_estado_anterior TEXT,
    p_estado_nuevo TEXT, p_id_usuario INT, p_observaciones TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
AS $$
BEGIN
    INSERT INTO historial_revision (entidad, id_registro, accion, estado_anterior, estado_nuevo, id_usuario, observaciones, fecha)
    VALUES (p_entidad, p_id_registro, p_accion, p_estado_anterior, p_estado_nuevo, p_id_usuario,
            NULLIF(btrim(COALESCE(p_observaciones, '')), ''), now());
END;
$$;

-- ---------------------------------------------------------------------
-- sp_dias_habiles: dias de lunes a viernes en (p_desde, p_hasta], sin contar
-- el dia inicial. 0 si p_hasta <= p_desde. Fechas en la zona de la sesion.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_dias_habiles(p_desde TIMESTAMPTZ, p_hasta TIMESTAMPTZ)
RETURNS INT
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
AS $$
DECLARE
    v_total INT;
BEGIN
    IF p_desde IS NULL OR p_hasta IS NULL OR p_hasta::date <= p_desde::date THEN
        RETURN 0;
    END IF;

    SELECT count(*)::int
      INTO v_total
      FROM generate_series(p_desde::date + 1, p_hasta::date, interval '1 day') AS d(dia)
     WHERE extract(isodow FROM d.dia) < 6;

    RETURN v_total;
END;
$$;

-- ---------------------------------------------------------------------
-- v_rev_pendientes (4.8): bandeja de revision. Va aqui (B2a) y no en
-- 20_vistas.sql para que exista desde el paquete comun.
-- id_editor/editor = autor de la operacion pendiente (cambios_pendientes->>'_id_editor')
-- o, si no hay operacion, el editor del registro.
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW v_rev_pendientes AS
WITH pendientes AS (
    SELECT 'publicacion'::text AS entidad,
           p.id_publicacion AS id_registro,
           p.titulo::text AS titulo,
           CASE WHEN p.estado = 'en_revision' THEN 'revision' ELSE p.operacion_pendiente::text END AS operacion,
           COALESCE((p.cambios_pendientes ->> '_id_editor')::int, p.id_editor) AS id_editor
      FROM publicacion p
     WHERE p.estado = 'en_revision' OR p.operacion_pendiente IS NOT NULL
    UNION ALL
    SELECT 'docente', d.id_docente, (d.nombres || ' ' || d.apellidos)::text,
           CASE WHEN d.estado = 'en_revision' THEN 'revision' ELSE d.operacion_pendiente::text END,
           COALESCE((d.cambios_pendientes ->> '_id_editor')::int, d.id_editor)
      FROM docente d
     WHERE d.estado = 'en_revision' OR d.operacion_pendiente IS NOT NULL
    UNION ALL
    SELECT 'plan', pe.id_plan, 'Plan ' || pe.anio || ' v' || pe.version, 'revision', pe.id_editor
      FROM plan_estudios pe
     WHERE pe.estado = 'en_revision'
    UNION ALL
    SELECT 'documento', dc.id_documento, dc.tipo::text || ' ' || dc.numero, 'revision', dc.id_editor
      FROM documento_oficial dc
     WHERE dc.estado = 'en_revision'
    UNION ALL
    SELECT 'campana', c.id_campana, 'Admisión ' || c.anio || COALESCE('-' || c.proceso, ''), 'revision', c.id_editor
      FROM campana_admision c
     WHERE c.estado = 'en_revision'
)
SELECT pd.entidad,
       pd.id_registro,
       pd.titulo,
       pd.operacion,
       pd.id_editor,
       (u.nombres || ' ' || u.apellidos)::text AS editor
  FROM pendientes pd
  LEFT JOIN usuario u ON u.id_usuario = pd.id_editor;
