-- =====================================================================
-- 11_sp_usuarios.sql - Procedimientos almacenados de usuarios (P5, HU1)
-- DISENO_BACKEND 3.4, 3.6 y 4.2. Idempotente (CREATE OR REPLACE).
-- Las contrasenas y tokens llegan ya hasheados desde PHP: la BD nunca ve
-- una contrasena en claro. Los correos se guardan en minusculas y se
-- comparan sin distinguir mayusculas.
-- bitacora_acceso: id_usuario = afectado (o el actor si no existe), id_usuario_actor = quien ejecuta.
-- =====================================================================

-- ---------------------------------------------------------------------
-- sp_usuario_registrar_acceso: inserta en la bitacora (acciones de 3.6).
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_usuario_registrar_acceso(
    p_id_usuario INT, p_accion TEXT, p_detalle TEXT, p_ip TEXT, p_id_actor INT)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
AS $$
BEGIN
    IF p_accion IS NULL OR p_accion NOT IN (
        'alta', 'cambio_rol', 'baja', 'recuperacion', 'denegado',
        'inicio_sesion', 'cierre_sesion', 'acceso_fallido', 'cambio_contrasena', 'edicion_datos') THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422',
            MESSAGE = format('Acción de bitácora no válida: %s', COALESCE(p_accion, '(nula)')),
            DETAIL = 'accion';
    END IF;

    IF p_id_usuario IS NULL THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422',
            MESSAGE = 'La bitácora requiere el usuario afectado',
            DETAIL = 'id_usuario';
    END IF;

    INSERT INTO bitacora_acceso (id_usuario, accion, fecha, detalle, id_usuario_actor, ip)
    VALUES (p_id_usuario, p_accion, now(), left(p_detalle, 255), p_id_actor, left(p_ip, 45));
END;
$$;

-- ---------------------------------------------------------------------
-- Auxiliar: valida nombres/apellidos/hash y unicidad del correo (23505).
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_usuario_validar_datos_alta(
    p_nombres TEXT, p_apellidos TEXT, p_correo TEXT, p_hash TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
AS $$
BEGIN
    IF char_length(btrim(COALESCE(p_nombres, ''))) = 0 THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'Los nombres son obligatorios', DETAIL = 'nombres';
    END IF;
    IF char_length(btrim(COALESCE(p_apellidos, ''))) = 0 THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'Los apellidos son obligatorios', DETAIL = 'apellidos';
    END IF;
    IF char_length(btrim(COALESCE(p_correo, ''))) = 0 THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'El correo institucional es obligatorio', DETAIL = 'correo_institucional';
    END IF;
    IF char_length(COALESCE(p_hash, '')) = 0 THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'La contraseña es obligatoria', DETAIL = 'contrasena';
    END IF;
    IF EXISTS (SELECT 1 FROM usuario WHERE lower(correo_institucional) = lower(btrim(p_correo))) THEN
        RAISE EXCEPTION USING ERRCODE = 'unique_violation',
            MESSAGE = 'Ya existe un usuario con ese correo institucional',
            DETAIL = 'correo_institucional';
    END IF;
END;
$$;

-- ---------------------------------------------------------------------
-- Auxiliar: cantidad de Administradores activos.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_usuario_contar_admins_activos()
RETURNS INT
LANGUAGE sql
SECURITY INVOKER
STABLE
AS $$
    SELECT count(*)::int
      FROM usuario u JOIN rol r ON r.id_rol = u.id_rol
     WHERE r.nombre = 'Administrador' AND u.estado = 'activo';
$$;

-- ---------------------------------------------------------------------
-- Auxiliar: bloquea y valida una solicitud autorizada y no ejecutada del tipo dado.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_solicitud_tomar_para_ejecutar(p_id_solicitud INT, p_tipo TEXT)
RETURNS solicitud_acceso
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
AS $$
DECLARE
    v_sol solicitud_acceso;
BEGIN
    SELECT * INTO v_sol FROM solicitud_acceso WHERE id_solicitud = p_id_solicitud FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION USING ERRCODE = 'RN404', MESSAGE = 'Solicitud no encontrada', DETAIL = 'id_solicitud';
    END IF;
    IF v_sol.tipo_solicitud::text <> p_tipo THEN
        RAISE EXCEPTION USING ERRCODE = 'RN409',
            MESSAGE = format('La solicitud #%s no es de tipo %s', p_id_solicitud, p_tipo),
            DETAIL = 'tipo_solicitud';
    END IF;
    IF v_sol.estado <> 'autorizada' THEN
        RAISE EXCEPTION USING ERRCODE = 'RN409',
            MESSAGE = format('La solicitud #%s no está autorizada', p_id_solicitud),
            DETAIL = 'estado';
    END IF;
    IF v_sol.fecha_ejecucion IS NOT NULL THEN
        RAISE EXCEPTION USING ERRCODE = 'RN409',
            MESSAGE = format('La solicitud #%s ya fue ejecutada', p_id_solicitud),
            DETAIL = 'fecha_ejecucion';
    END IF;
    RETURN v_sol;
END;
$$;

-- ---------------------------------------------------------------------
-- sp_usuario_crear: alta con solicitud autorizada (Administrador).
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_usuario_crear(
    p_id_admin INT, p_id_solicitud INT, p_nombres TEXT, p_apellidos TEXT,
    p_correo TEXT, p_contrasena_hash TEXT, p_cargo TEXT)
RETURNS INT
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
AS $$
DECLARE
    v_sol solicitud_acceso;
    v_id  INT;
    v_rol TEXT;
BEGIN
    PERFORM sp_rev_assert_rol(p_id_admin, ARRAY['Administrador']);
    v_sol := sp_solicitud_tomar_para_ejecutar(p_id_solicitud, 'alta');

    IF lower(btrim(COALESCE(p_correo, ''))) <> lower(COALESCE(v_sol.correo_solicitado, '')) THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422',
            MESSAGE = 'El correo no coincide con el de la solicitud autorizada',
            DETAIL = 'correo_institucional';
    END IF;

    PERFORM sp_usuario_validar_datos_alta(p_nombres, p_apellidos, p_correo, p_contrasena_hash);

    INSERT INTO usuario (nombres, apellidos, correo_institucional, contrasena_hash, id_rol,
                         estado, debe_cambiar_contrasena, fecha_creacion, cargo)
    VALUES (btrim(p_nombres), btrim(p_apellidos), lower(btrim(p_correo)), p_contrasena_hash, v_sol.id_rol_solicitado,
            'activo', TRUE, now(), NULLIF(btrim(COALESCE(p_cargo, '')), ''))
    RETURNING id_usuario INTO v_id;

    UPDATE solicitud_acceso
       SET fecha_ejecucion = now(), id_usuario_objetivo = v_id
     WHERE id_solicitud = p_id_solicitud;

    SELECT nombre INTO v_rol FROM rol WHERE id_rol = v_sol.id_rol_solicitado;
    PERFORM sp_usuario_registrar_acceso(v_id, 'alta',
        format('Solicitud #%s ejecutada: alta como %s', p_id_solicitud, v_rol), NULL, p_id_admin);

    RETURN v_id;
END;
$$;

-- ---------------------------------------------------------------------
-- sp_usuario_crear_inicial: arranque por consola (portal:crear-usuario).
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_usuario_crear_inicial(
    p_nombres TEXT, p_apellidos TEXT, p_correo TEXT, p_hash TEXT, p_rol TEXT, p_cargo TEXT)
RETURNS INT
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
AS $$
DECLARE
    v_id_rol INT;
    v_id     INT;
BEGIN
    SELECT id_rol INTO v_id_rol FROM rol WHERE nombre = p_rol;
    IF NOT FOUND THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422',
            MESSAGE = format('Rol inexistente: %s', COALESCE(p_rol, '(nulo)')),
            DETAIL = 'rol';
    END IF;

    PERFORM sp_usuario_validar_datos_alta(p_nombres, p_apellidos, p_correo, p_hash);

    INSERT INTO usuario (nombres, apellidos, correo_institucional, contrasena_hash, id_rol,
                         estado, debe_cambiar_contrasena, fecha_creacion, cargo)
    VALUES (btrim(p_nombres), btrim(p_apellidos), lower(btrim(p_correo)), p_hash, v_id_rol,
            'activo', TRUE, now(), NULLIF(btrim(COALESCE(p_cargo, '')), ''))
    RETURNING id_usuario INTO v_id;

    PERFORM sp_usuario_registrar_acceso(v_id, 'alta', format('Creado por consola como %s', p_rol), NULL, NULL);

    RETURN v_id;
END;
$$;

-- ---------------------------------------------------------------------
-- sp_usuario_cambiar_rol: ejecuta una solicitud de cambio de rol autorizada.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_usuario_cambiar_rol(p_id_admin INT, p_id_solicitud INT)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
AS $$
DECLARE
    v_sol        solicitud_acceso;
    v_estado     TEXT;
    v_rol_actual TEXT;
    v_rol_nuevo  TEXT;
BEGIN
    PERFORM sp_rev_assert_rol(p_id_admin, ARRAY['Administrador']);
    v_sol := sp_solicitud_tomar_para_ejecutar(p_id_solicitud, 'cambio_rol');

    SELECT u.estado::text, r.nombre INTO v_estado, v_rol_actual
      FROM usuario u JOIN rol r ON r.id_rol = u.id_rol
     WHERE u.id_usuario = v_sol.id_usuario_objetivo
       FOR UPDATE OF u;
    IF NOT FOUND THEN
        RAISE EXCEPTION USING ERRCODE = 'RN404', MESSAGE = 'Usuario objetivo no encontrado', DETAIL = 'id_usuario_objetivo';
    END IF;
    IF v_estado <> 'activo' THEN
        RAISE EXCEPTION USING ERRCODE = 'RN409', MESSAGE = 'El usuario objetivo está inactivo', DETAIL = 'id_usuario_objetivo';
    END IF;

    SELECT nombre INTO v_rol_nuevo FROM rol WHERE id_rol = v_sol.id_rol_solicitado;
    IF v_rol_nuevo = v_rol_actual THEN
        RAISE EXCEPTION USING ERRCODE = 'RN409', MESSAGE = 'El usuario ya tiene ese rol', DETAIL = 'id_rol_solicitado';
    END IF;
    IF v_rol_actual = 'Administrador' AND sp_usuario_contar_admins_activos() <= 1 THEN
        RAISE EXCEPTION USING ERRCODE = 'RN409',
            MESSAGE = 'No se puede quitar el rol al último Administrador activo',
            DETAIL = 'id_usuario_objetivo';
    END IF;

    UPDATE usuario SET id_rol = v_sol.id_rol_solicitado WHERE id_usuario = v_sol.id_usuario_objetivo;
    UPDATE solicitud_acceso SET fecha_ejecucion = now() WHERE id_solicitud = p_id_solicitud;

    PERFORM sp_usuario_registrar_acceso(v_sol.id_usuario_objetivo, 'cambio_rol',
        format('Solicitud #%s: de %s a %s', p_id_solicitud, v_rol_actual, v_rol_nuevo), NULL, p_id_admin);
END;
$$;

-- ---------------------------------------------------------------------
-- sp_usuario_desactivar: baja = desactivar (nunca eliminar) + revocar sesiones y tokens.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_usuario_desactivar(p_id_admin INT, p_id_solicitud INT, p_ip TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
AS $$
DECLARE
    v_sol    solicitud_acceso;
    v_estado TEXT;
    v_rol    TEXT;
BEGIN
    PERFORM sp_rev_assert_rol(p_id_admin, ARRAY['Administrador']);
    v_sol := sp_solicitud_tomar_para_ejecutar(p_id_solicitud, 'baja');

    IF v_sol.id_usuario_objetivo = p_id_admin THEN
        RAISE EXCEPTION USING ERRCODE = 'RN409', MESSAGE = 'No puede darse de baja a sí mismo', DETAIL = 'id_usuario_objetivo';
    END IF;

    SELECT u.estado::text, r.nombre INTO v_estado, v_rol
      FROM usuario u JOIN rol r ON r.id_rol = u.id_rol
     WHERE u.id_usuario = v_sol.id_usuario_objetivo
       FOR UPDATE OF u;
    IF NOT FOUND THEN
        RAISE EXCEPTION USING ERRCODE = 'RN404', MESSAGE = 'Usuario objetivo no encontrado', DETAIL = 'id_usuario_objetivo';
    END IF;
    IF v_estado <> 'activo' THEN
        RAISE EXCEPTION USING ERRCODE = 'RN409', MESSAGE = 'El usuario objetivo ya está inactivo', DETAIL = 'id_usuario_objetivo';
    END IF;
    IF v_rol = 'Administrador' AND sp_usuario_contar_admins_activos() <= 1 THEN
        RAISE EXCEPTION USING ERRCODE = 'RN409',
            MESSAGE = 'No se puede dar de baja al último Administrador activo',
            DETAIL = 'id_usuario_objetivo';
    END IF;

    UPDATE usuario SET estado = 'inactivo' WHERE id_usuario = v_sol.id_usuario_objetivo;
    DELETE FROM sessions WHERE user_id = v_sol.id_usuario_objetivo;
    UPDATE token_recuperacion SET fecha_uso = now()
     WHERE id_usuario = v_sol.id_usuario_objetivo AND fecha_uso IS NULL;
    UPDATE solicitud_acceso SET fecha_ejecucion = now() WHERE id_solicitud = p_id_solicitud;

    PERFORM sp_usuario_registrar_acceso(v_sol.id_usuario_objetivo, 'baja',
        format('Solicitud #%s ejecutada: cuenta desactivada y sesiones revocadas', p_id_solicitud), p_ip, p_id_admin);
END;
$$;

-- ---------------------------------------------------------------------
-- sp_usuario_actualizar_datos: nombres, apellidos y cargo (Administrador).
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_usuario_actualizar_datos(
    p_id_admin INT, p_id_usuario INT, p_nombres TEXT, p_apellidos TEXT, p_cargo TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
AS $$
BEGIN
    PERFORM sp_rev_assert_rol(p_id_admin, ARRAY['Administrador']);

    IF char_length(btrim(COALESCE(p_nombres, ''))) = 0 THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'Los nombres son obligatorios', DETAIL = 'nombres';
    END IF;
    IF char_length(btrim(COALESCE(p_apellidos, ''))) = 0 THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'Los apellidos son obligatorios', DETAIL = 'apellidos';
    END IF;

    UPDATE usuario
       SET nombres = btrim(p_nombres), apellidos = btrim(p_apellidos),
           cargo = NULLIF(btrim(COALESCE(p_cargo, '')), '')
     WHERE id_usuario = p_id_usuario;
    IF NOT FOUND THEN
        RAISE EXCEPTION USING ERRCODE = 'RN404', MESSAGE = 'Usuario no encontrado', DETAIL = 'id_usuario';
    END IF;

    PERFORM sp_usuario_registrar_acceso(p_id_usuario, 'edicion_datos',
        format('Datos editados por Administrador #%s', p_id_admin), NULL, p_id_admin);
END;
$$;

-- ---------------------------------------------------------------------
-- sp_usuario_cambiar_contrasena: el propio usuario (la actual se verifica en PHP).
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_usuario_cambiar_contrasena(p_id_usuario INT, p_nuevo_hash TEXT, p_ip TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
AS $$
DECLARE
    v_estado TEXT;
BEGIN
    SELECT estado::text INTO v_estado FROM usuario WHERE id_usuario = p_id_usuario FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION USING ERRCODE = 'RN404', MESSAGE = 'Usuario no encontrado', DETAIL = 'id_usuario';
    END IF;
    IF v_estado <> 'activo' THEN
        RAISE EXCEPTION USING ERRCODE = 'RN403', MESSAGE = 'La cuenta está inactiva', DETAIL = 'estado';
    END IF;
    IF char_length(COALESCE(p_nuevo_hash, '')) = 0 THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'La contraseña es obligatoria', DETAIL = 'contrasena';
    END IF;

    UPDATE usuario SET contrasena_hash = p_nuevo_hash, debe_cambiar_contrasena = FALSE
     WHERE id_usuario = p_id_usuario;

    PERFORM sp_usuario_registrar_acceso(p_id_usuario, 'cambio_contrasena', 'Contraseña cambiada por el usuario', p_ip, p_id_usuario);
END;
$$;

-- ---------------------------------------------------------------------
-- sp_token_recuperacion_crear: NULL (sin error) si no hay usuario activo con ese correo.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_token_recuperacion_crear(p_correo TEXT, p_token_hash TEXT, p_minutos INT, p_ip TEXT)
RETURNS INT
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
AS $$
DECLARE
    v_id_usuario INT;
    v_id_token   INT;
BEGIN
    IF COALESCE(p_minutos, 0) <= 0 THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'La vigencia del token debe ser positiva', DETAIL = 'minutos';
    END IF;
    IF char_length(COALESCE(p_token_hash, '')) <> 64 THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'Token con formato inválido', DETAIL = 'token';
    END IF;

    SELECT id_usuario INTO v_id_usuario
      FROM usuario
     WHERE lower(correo_institucional) = lower(btrim(COALESCE(p_correo, ''))) AND estado = 'activo'
       FOR UPDATE;
    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    UPDATE token_recuperacion SET fecha_uso = now()
     WHERE id_usuario = v_id_usuario AND fecha_uso IS NULL;

    INSERT INTO token_recuperacion (id_usuario, token_hash, fecha_expira, fecha_creacion)
    VALUES (v_id_usuario, p_token_hash, now() + make_interval(mins => p_minutos), now())
    RETURNING id_token INTO v_id_token;

    PERFORM sp_usuario_registrar_acceso(v_id_usuario, 'recuperacion', 'Recuperación solicitada', p_ip, v_id_usuario);

    RETURN v_id_token;
END;
$$;

-- ---------------------------------------------------------------------
-- sp_token_recuperacion_consumir: uso unico; fija contrasena, borra sesiones. Devuelve id_usuario.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_token_recuperacion_consumir(p_correo TEXT, p_token_hash TEXT, p_nuevo_hash TEXT, p_ip TEXT)
RETURNS INT
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
AS $$
DECLARE
    v_id_token   INT;
    v_id_usuario INT;
BEGIN
    SELECT t.id_token, t.id_usuario INTO v_id_token, v_id_usuario
      FROM token_recuperacion t
      JOIN usuario u ON u.id_usuario = t.id_usuario
     WHERE t.token_hash = p_token_hash
       AND lower(u.correo_institucional) = lower(btrim(COALESCE(p_correo, '')))
       AND t.fecha_uso IS NULL
       AND t.fecha_expira > now()
       AND u.estado = 'activo'
       FOR UPDATE OF t, u;
    IF NOT FOUND THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'Enlace inválido o vencido', DETAIL = 'token';
    END IF;
    IF char_length(COALESCE(p_nuevo_hash, '')) = 0 THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'La contraseña es obligatoria', DETAIL = 'contrasena';
    END IF;

    UPDATE token_recuperacion SET fecha_uso = now()
     WHERE id_usuario = v_id_usuario AND fecha_uso IS NULL;
    UPDATE usuario SET contrasena_hash = p_nuevo_hash, debe_cambiar_contrasena = FALSE
     WHERE id_usuario = v_id_usuario;
    DELETE FROM sessions WHERE user_id = v_id_usuario;

    PERFORM sp_usuario_registrar_acceso(v_id_usuario, 'recuperacion', 'Recuperación completada', p_ip, v_id_usuario);

    RETURN v_id_usuario;
END;
$$;

-- ---------------------------------------------------------------------
-- sp_token_recuperacion_purgar: borra tokens con mas de 7 dias. Devuelve cantidad.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_token_recuperacion_purgar()
RETURNS INT
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
AS $$
DECLARE
    v_total INT;
BEGIN
    DELETE FROM token_recuperacion WHERE fecha_creacion < now() - interval '7 days';
    GET DIAGNOSTICS v_total = ROW_COUNT;
    RETURN v_total;
END;
$$;

-- ---------------------------------------------------------------------
-- sp_solicitud_registrar: Administrador o Revisor, en nombre del solicitante.
-- Alta: p_id_rol y p_correo obligatorios. Cambio de rol: p_id_usuario_objetivo y
-- p_id_rol (distinto del actual). Baja: p_id_usuario_objetivo (el rol se toma del objetivo).
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_solicitud_registrar(
    p_id_actor INT, p_solicitante_nombre TEXT, p_tipo TEXT, p_id_rol INT,
    p_motivo TEXT, p_correo TEXT, p_id_usuario_objetivo INT)
RETURNS INT
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
AS $$
DECLARE
    v_correo     TEXT := NULLIF(lower(btrim(COALESCE(p_correo, ''))), '');
    v_rol        INT  := p_id_rol;
    v_objetivo   INT  := p_id_usuario_objetivo;
    v_estado_obj TEXT;
    v_rol_obj    INT;
    v_id         INT;
BEGIN
    PERFORM sp_rev_assert_rol(p_id_actor, ARRAY['Administrador', 'Revisor']);

    IF char_length(btrim(COALESCE(p_solicitante_nombre, ''))) = 0 THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'El nombre del solicitante es obligatorio', DETAIL = 'solicitante_nombre';
    END IF;
    IF p_tipo IS NULL OR p_tipo NOT IN ('alta', 'cambio_rol', 'baja') THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'Tipo de solicitud no válido', DETAIL = 'tipo_solicitud';
    END IF;

    IF p_tipo = 'alta' THEN
        v_objetivo := NULL;
        IF v_correo IS NULL THEN
            RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'El correo es obligatorio para un alta', DETAIL = 'correo_solicitado';
        END IF;
        IF EXISTS (SELECT 1 FROM usuario WHERE lower(correo_institucional) = v_correo) THEN
            RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'Ya existe un usuario con ese correo', DETAIL = 'correo_solicitado';
        END IF;
    ELSE
        v_correo := NULL;
        IF v_objetivo IS NULL THEN
            RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'Debe indicar el usuario objetivo', DETAIL = 'id_usuario_objetivo';
        END IF;
        SELECT estado::text, id_rol INTO v_estado_obj, v_rol_obj FROM usuario WHERE id_usuario = v_objetivo;
        IF NOT FOUND THEN
            RAISE EXCEPTION USING ERRCODE = 'RN404', MESSAGE = 'Usuario objetivo no encontrado', DETAIL = 'id_usuario_objetivo';
        END IF;
        IF v_estado_obj <> 'activo' THEN
            RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'El usuario objetivo está inactivo', DETAIL = 'id_usuario_objetivo';
        END IF;
        IF p_tipo = 'baja' THEN
            v_rol := v_rol_obj;
        ELSIF v_rol IS NOT NULL AND v_rol = v_rol_obj THEN
            RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'El usuario ya tiene ese rol', DETAIL = 'id_rol_solicitado';
        END IF;
    END IF;

    IF v_rol IS NULL OR NOT EXISTS (SELECT 1 FROM rol WHERE id_rol = v_rol) THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'Rol solicitado no válido', DETAIL = 'id_rol_solicitado';
    END IF;

    IF EXISTS (SELECT 1 FROM solicitud_acceso
                WHERE estado = 'pendiente'
                  AND ((v_objetivo IS NOT NULL AND id_usuario_objetivo = v_objetivo)
                    OR (v_correo IS NOT NULL AND lower(correo_solicitado) = v_correo))) THEN
        RAISE EXCEPTION USING ERRCODE = 'RN409',
            MESSAGE = 'Ya existe una solicitud pendiente para ese usuario o correo',
            DETAIL = CASE WHEN v_objetivo IS NULL THEN 'correo_solicitado' ELSE 'id_usuario_objetivo' END;
    END IF;

    INSERT INTO solicitud_acceso (solicitante_nombre, id_rol_solicitado, tipo_solicitud, motivo, estado,
                                  fecha_solicitud, correo_solicitado, id_usuario_objetivo)
    VALUES (btrim(p_solicitante_nombre), v_rol, p_tipo::tipo_solicitud, NULLIF(btrim(COALESCE(p_motivo, '')), ''),
            'pendiente', now(), v_correo, v_objetivo)
    RETURNING id_solicitud INTO v_id;

    RETURN v_id;
END;
$$;

-- ---------------------------------------------------------------------
-- sp_solicitud_resolver: el Revisor autoriza o deniega una solicitud pendiente.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_solicitud_resolver(
    p_id_revisor INT, p_id_solicitud INT, p_autorizar BOOL, p_observacion TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
AS $$
DECLARE
    v_sol solicitud_acceso;
BEGIN
    PERFORM sp_rev_assert_rol(p_id_revisor, ARRAY['Revisor']);

    IF p_autorizar IS NULL THEN
        RAISE EXCEPTION USING ERRCODE = 'RN422', MESSAGE = 'Debe indicar si autoriza o deniega', DETAIL = 'autorizar';
    END IF;

    SELECT * INTO v_sol FROM solicitud_acceso WHERE id_solicitud = p_id_solicitud FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION USING ERRCODE = 'RN404', MESSAGE = 'Solicitud no encontrada', DETAIL = 'id_solicitud';
    END IF;
    IF v_sol.estado <> 'pendiente' THEN
        RAISE EXCEPTION USING ERRCODE = 'RN409', MESSAGE = 'La solicitud ya fue resuelta', DETAIL = 'estado';
    END IF;

    UPDATE solicitud_acceso
       SET estado = CASE WHEN p_autorizar THEN 'autorizada'::estado_solicitud ELSE 'denegada'::estado_solicitud END,
           id_director_autoriza = p_id_revisor,
           fecha_resolucion = GREATEST(now()::timestamp, fecha_solicitud),
           observacion_resolucion = NULLIF(left(btrim(COALESCE(p_observacion, '')), 255), '')
     WHERE id_solicitud = p_id_solicitud;

    IF NOT p_autorizar THEN
        PERFORM sp_usuario_registrar_acceso(COALESCE(v_sol.id_usuario_objetivo, p_id_revisor), 'denegado',
            format('Solicitud #%s (%s) denegada por Revisor #%s', p_id_solicitud, v_sol.tipo_solicitud, p_id_revisor),
            NULL, p_id_revisor);
    END IF;
END;
$$;
