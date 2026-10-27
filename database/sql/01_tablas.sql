-- =====================================================================
-- 01_tablas.sql  -  Portal de Gestion de Direccion de Escuela (UNT)
-- Esquema relacional de 18 tablas (informe, "Modelo logico relacional").
-- PostgreSQL 18. Orden: tipos ENUM -> tablas -> indices -> comentarios.
-- =====================================================================

-- ---------- Tipos ENUM ----------
CREATE TYPE estado_usuario        AS ENUM ('activo', 'inactivo');
CREATE TYPE tipo_solicitud        AS ENUM ('alta', 'cambio_rol', 'baja');
CREATE TYPE estado_solicitud      AS ENUM ('pendiente', 'autorizada', 'denegada');
CREATE TYPE estado_publicacion    AS ENUM ('borrador', 'en_revision', 'publicada', 'descartada', 'despublicada');
CREATE TYPE condicion_laboral     AS ENUM ('nombrado', 'contratado');
CREATE TYPE estado_docente        AS ENUM ('borrador', 'en_revision', 'publicado', 'inactivo');
CREATE TYPE estado_consulta       AS ENUM ('recibida', 'en_atencion', 'atendida', 'descartada', 'derivada');
CREATE TYPE estado_plan           AS ENUM ('borrador', 'en_revision', 'vigente', 'historico', 'descartado');
CREATE TYPE tipo_curso            AS ENUM ('obligatorio', 'electivo');
CREATE TYPE tipo_documento        AS ENUM ('resolucion', 'guia', 'politica');
CREATE TYPE estado_documento      AS ENUM ('en_revision', 'vigente', 'historico', 'vencido', 'no_publicado');
CREATE TYPE estado_campana        AS ENUM ('borrador', 'en_revision', 'vigente', 'cerrada', 'archivada');

-- ---------- P5: usuarios, roles y accesos ----------
CREATE TABLE rol (
    id_rol      INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre      VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(255)
);

CREATE TABLE usuario (
    id_usuario               INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombres                  VARCHAR(100) NOT NULL,
    apellidos                VARCHAR(100) NOT NULL,
    correo_institucional     VARCHAR(150) NOT NULL UNIQUE,
    contrasena_hash          VARCHAR(255) NOT NULL,
    id_rol                   INTEGER NOT NULL REFERENCES rol(id_rol),
    estado                   estado_usuario NOT NULL DEFAULT 'activo',
    debe_cambiar_contrasena  BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion           TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX ix_usuario_id_rol ON usuario(id_rol);
CREATE INDEX ix_usuario_estado ON usuario(estado);

CREATE TABLE bitacora_acceso (
    id_bitacora INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_usuario  INTEGER NOT NULL REFERENCES usuario(id_usuario),
    accion      VARCHAR(100) NOT NULL
                CHECK (accion IN ('alta', 'cambio_rol', 'baja', 'recuperacion', 'denegado')),
    fecha       TIMESTAMP NOT NULL DEFAULT now(),
    detalle     VARCHAR(255)
);
CREATE INDEX ix_bitacora_id_usuario ON bitacora_acceso(id_usuario);
CREATE INDEX ix_bitacora_fecha      ON bitacora_acceso(fecha);

CREATE TABLE solicitud_acceso (
    id_solicitud         INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    solicitante_nombre   VARCHAR(150) NOT NULL,
    id_rol_solicitado    INTEGER NOT NULL REFERENCES rol(id_rol),
    tipo_solicitud       tipo_solicitud NOT NULL,
    motivo               VARCHAR(255),
    estado               estado_solicitud NOT NULL DEFAULT 'pendiente',
    id_director_autoriza INTEGER REFERENCES usuario(id_usuario),
    fecha_solicitud      TIMESTAMP NOT NULL DEFAULT now(),
    fecha_resolucion     TIMESTAMP,
    CHECK (fecha_resolucion IS NULL OR fecha_resolucion >= fecha_solicitud)
);
CREATE INDEX ix_solicitud_id_rol_solicitado ON solicitud_acceso(id_rol_solicitado);
CREATE INDEX ix_solicitud_id_director       ON solicitud_acceso(id_director_autoriza);
CREATE INDEX ix_solicitud_estado            ON solicitud_acceso(estado);

-- ---------- P3, P4, P7: departamento ----------
CREATE TABLE departamento (
    id_departamento INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre          VARCHAR(150) NOT NULL UNIQUE
);

-- ---------- P1, P2: publicaciones ----------
CREATE TABLE publicacion (
    id_publicacion                 INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    titulo                         VARCHAR(200) NOT NULL,
    resumen                        VARCHAR(500),
    contenido                      TEXT,
    categoria                      VARCHAR(100),
    estado                         estado_publicacion NOT NULL DEFAULT 'borrador',
    fecha_publicacion_programada   DATE,
    fecha_creacion                 TIMESTAMP NOT NULL DEFAULT now(),
    id_editor                      INTEGER NOT NULL REFERENCES usuario(id_usuario),
    id_director_revisa             INTEGER REFERENCES usuario(id_usuario),
    fecha_decision                 TIMESTAMP,
    observaciones_revision         VARCHAR(500)
);
CREATE INDEX ix_publicacion_estado         ON publicacion(estado);
CREATE INDEX ix_publicacion_fecha_prog     ON publicacion(fecha_publicacion_programada);
CREATE INDEX ix_publicacion_categoria      ON publicacion(categoria);
CREATE INDEX ix_publicacion_id_editor      ON publicacion(id_editor);
CREATE INDEX ix_publicacion_id_director    ON publicacion(id_director_revisa);

CREATE TABLE archivo_publicacion (
    id_archivo     INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_publicacion INTEGER NOT NULL REFERENCES publicacion(id_publicacion),
    ruta_archivo   VARCHAR(255) NOT NULL,
    ancho_px       INTEGER CHECK (ancho_px > 0),
    alto_px        INTEGER CHECK (alto_px > 0)
);
CREATE INDEX ix_archivo_pub_id_publicacion ON archivo_publicacion(id_publicacion);

-- ---------- P3: plana docente ----------
CREATE TABLE docente (
    id_docente             INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombres                VARCHAR(100) NOT NULL,
    apellidos              VARCHAR(100) NOT NULL,
    grado_academico        VARCHAR(100),
    id_departamento        INTEGER NOT NULL REFERENCES departamento(id_departamento),
    curso_principal        VARCHAR(150),
    condicion_laboral      condicion_laboral,
    es_investigador        BOOLEAN NOT NULL DEFAULT FALSE,
    categoria_renacyt      VARCHAR(50),
    ruta_fotografia        VARCHAR(255),
    encuadre_x             INTEGER,
    encuadre_y             INTEGER,
    estado                 estado_docente NOT NULL DEFAULT 'borrador',
    fecha_registro         TIMESTAMP NOT NULL DEFAULT now(),
    id_editor              INTEGER NOT NULL REFERENCES usuario(id_usuario),
    id_director_revisa     INTEGER REFERENCES usuario(id_usuario),
    fecha_decision         TIMESTAMP,
    observaciones_revision VARCHAR(500),
    CONSTRAINT ck_docente_renacyt_solo_investigador
        CHECK (es_investigador OR categoria_renacyt IS NULL)
);
CREATE INDEX ix_docente_id_departamento ON docente(id_departamento);
CREATE INDEX ix_docente_estado          ON docente(estado);
CREATE INDEX ix_docente_es_investigador ON docente(es_investigador);
CREATE INDEX ix_docente_id_editor       ON docente(id_editor);
CREATE INDEX ix_docente_id_director     ON docente(id_director_revisa);

CREATE TABLE especialidad_docente (
    id_docente   INTEGER NOT NULL REFERENCES docente(id_docente),
    especialidad VARCHAR(150) NOT NULL,
    PRIMARY KEY (id_docente, especialidad)
);

-- ---------- P4: contacto ----------
CREATE TABLE consulta_contacto (
    id_consulta                 INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre_visitante            VARCHAR(150) NOT NULL,
    correo_visitante            VARCHAR(150) NOT NULL,
    asunto                      VARCHAR(150),
    mensaje                     TEXT NOT NULL,
    estado                      estado_consulta NOT NULL DEFAULT 'recibida',
    id_departamento_responsable INTEGER REFERENCES departamento(id_departamento),
    id_editor_clasifica         INTEGER REFERENCES usuario(id_usuario),
    respuesta                   TEXT,
    fecha_recepcion             TIMESTAMP NOT NULL DEFAULT now(),
    fecha_respuesta             TIMESTAMP,
    CHECK (fecha_respuesta IS NULL OR fecha_respuesta >= fecha_recepcion)
);
CREATE INDEX ix_consulta_estado          ON consulta_contacto(estado);
CREATE INDEX ix_consulta_fecha_recepcion ON consulta_contacto(fecha_recepcion);
CREATE INDEX ix_consulta_id_departamento ON consulta_contacto(id_departamento_responsable);
CREATE INDEX ix_consulta_id_editor       ON consulta_contacto(id_editor_clasifica);

-- ---------- P6: plan de estudios ----------
CREATE TABLE plan_estudios (
    id_plan                INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    anio                   INTEGER NOT NULL,
    version                VARCHAR(20) NOT NULL,
    estado                 estado_plan NOT NULL DEFAULT 'borrador',
    es_predeterminada      BOOLEAN NOT NULL DEFAULT FALSE,
    archivo_pdf_plan       VARCHAR(255),
    archivo_pdf_resolucion VARCHAR(255),
    fecha_publicacion      TIMESTAMP,
    id_editor              INTEGER NOT NULL REFERENCES usuario(id_usuario),
    id_director_revisa     INTEGER REFERENCES usuario(id_usuario),
    fecha_decision         TIMESTAMP,
    observaciones_revision VARCHAR(500),
    CONSTRAINT uq_plan_anio_version UNIQUE (anio, version)
);
-- Una sola version predeterminada a la vez
CREATE UNIQUE INDEX uq_plan_predeterminada ON plan_estudios (es_predeterminada) WHERE es_predeterminada;
CREATE INDEX ix_plan_estado      ON plan_estudios(estado);
CREATE INDEX ix_plan_anio        ON plan_estudios(anio);
CREATE INDEX ix_plan_id_editor   ON plan_estudios(id_editor);
CREATE INDEX ix_plan_id_director ON plan_estudios(id_director_revisa);

CREATE TABLE curso (
    id_curso       INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_plan        INTEGER NOT NULL REFERENCES plan_estudios(id_plan),
    codigo         VARCHAR(20) NOT NULL,
    nombre         VARCHAR(150) NOT NULL,
    creditos       INTEGER NOT NULL CHECK (creditos > 0),
    tipo           tipo_curso NOT NULL DEFAULT 'obligatorio',
    ciclo          INTEGER NOT NULL CHECK (ciclo > 0),
    area_formacion VARCHAR(100),
    CONSTRAINT uq_curso_plan_codigo UNIQUE (id_plan, codigo)
);
CREATE INDEX ix_curso_ciclo ON curso(id_plan, ciclo);

CREATE TABLE prerrequisito (
    id_curso           INTEGER NOT NULL REFERENCES curso(id_curso),
    id_curso_requerido INTEGER NOT NULL REFERENCES curso(id_curso),
    PRIMARY KEY (id_curso, id_curso_requerido),
    CHECK (id_curso <> id_curso_requerido)
);
CREATE INDEX ix_prerreq_requerido ON prerrequisito(id_curso_requerido);

-- ---------- P7: documentos oficiales ----------
CREATE TABLE documento_oficial (
    id_documento           INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tipo                   tipo_documento NOT NULL,
    numero                 VARCHAR(50) NOT NULL,
    fecha_emision          DATE NOT NULL,
    id_departamento_emisor INTEGER NOT NULL REFERENCES departamento(id_departamento),
    fecha_vigencia         DATE NOT NULL,
    archivo_pdf            VARCHAR(255) NOT NULL,
    estado                 estado_documento NOT NULL DEFAULT 'en_revision',
    id_version_anterior    INTEGER UNIQUE REFERENCES documento_oficial(id_documento),
    id_editor              INTEGER NOT NULL REFERENCES usuario(id_usuario),
    id_director_revisa     INTEGER REFERENCES usuario(id_usuario),
    fecha_decision         TIMESTAMP,
    observaciones_revision VARCHAR(500),
    CHECK (fecha_vigencia >= fecha_emision),
    CHECK (id_version_anterior IS NULL OR id_version_anterior <> id_documento)
);
CREATE INDEX ix_documento_estado       ON documento_oficial(estado);
CREATE INDEX ix_documento_tipo         ON documento_oficial(tipo);
CREATE INDEX ix_documento_fecha_vig    ON documento_oficial(fecha_vigencia);
CREATE INDEX ix_documento_departamento ON documento_oficial(id_departamento_emisor);
CREATE INDEX ix_documento_id_editor    ON documento_oficial(id_editor);
CREATE INDEX ix_documento_id_director  ON documento_oficial(id_director_revisa);

-- ---------- P8: admision ----------
CREATE TABLE campana_admision (
    id_campana             INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    anio                   INTEGER NOT NULL,
    proceso                VARCHAR(50),
    estado                 estado_campana NOT NULL DEFAULT 'borrador',
    fecha_inicio           DATE,
    fecha_fin              DATE,
    url_portal             VARCHAR(255),
    url_estadisticas       VARCHAR(255),
    id_editor              INTEGER NOT NULL REFERENCES usuario(id_usuario),
    id_director_revisa     INTEGER REFERENCES usuario(id_usuario),
    fecha_decision         TIMESTAMP,
    observaciones_revision VARCHAR(500),
    CHECK (fecha_fin IS NULL OR fecha_inicio IS NULL OR fecha_fin >= fecha_inicio)
);
-- Una sola campana vigente a la vez
CREATE UNIQUE INDEX uq_campana_vigente ON campana_admision ((estado)) WHERE estado = 'vigente';
CREATE INDEX ix_campana_estado      ON campana_admision(estado);
CREATE INDEX ix_campana_anio        ON campana_admision(anio);
CREATE INDEX ix_campana_id_editor   ON campana_admision(id_editor);
CREATE INDEX ix_campana_id_director ON campana_admision(id_director_revisa);

CREATE TABLE modalidad_admision (
    id_modalidad INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_campana   INTEGER NOT NULL REFERENCES campana_admision(id_campana),
    nombre       VARCHAR(100) NOT NULL,
    dirigido_a   VARCHAR(150),
    vacantes     INTEGER CHECK (vacantes > 0),
    descripcion  TEXT
);
CREATE INDEX ix_modalidad_id_campana ON modalidad_admision(id_campana);

CREATE TABLE cronograma_admision (
    id_hito    INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_campana INTEGER NOT NULL REFERENCES campana_admision(id_campana),
    hito       VARCHAR(150) NOT NULL,
    fecha      DATE NOT NULL
);
CREATE INDEX ix_cronograma_campana_fecha ON cronograma_admision(id_campana, fecha);

-- ---------- P9: visitas (anonimo, sin FK) ----------
CREATE TABLE registro_visita (
    id_visita INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    seccion   VARCHAR(100) NOT NULL
              CHECK (seccion IN ('admision', 'plan_estudios', 'docentes', 'documentos', 'contacto')),
    fecha     TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX ix_visita_seccion_fecha ON registro_visita(seccion, fecha);

-- ---------- Comentarios ----------
COMMENT ON TABLE rol IS 'P5. Roles del portal: Editor, Revisor, Administrador.';
COMMENT ON TABLE usuario IS 'P5. Cuentas institucionales del panel; la baja es logica (estado inactivo).';
COMMENT ON COLUMN usuario.contrasena_hash IS 'P5. Hash bcrypt; nunca en claro.';
COMMENT ON COLUMN usuario.debe_cambiar_contrasena IS 'P5. TRUE hasta el primer inicio de sesion.';
COMMENT ON TABLE bitacora_acceso IS 'P5. Trazabilidad de altas, cambios de rol, bajas, recuperaciones y accesos denegados.';
COMMENT ON COLUMN bitacora_acceso.accion IS 'P5. alta / cambio_rol / baja / recuperacion / denegado.';
COMMENT ON TABLE solicitud_acceso IS 'P5. Solicitudes de alta, cambio de rol o baja que autoriza el Director.';
COMMENT ON COLUMN solicitud_acceso.id_director_autoriza IS 'P5. NULL hasta resolver.';
COMMENT ON TABLE departamento IS 'P3, P4, P7. Departamentos academicos (docentes, emisores de documentos, derivacion de consultas).';
COMMENT ON TABLE publicacion IS 'P1, P2. Noticias y comunicados con ciclo borrador, revision y publicacion.';
COMMENT ON COLUMN publicacion.fecha_publicacion_programada IS 'P2. Fecha en que pasa a publicada; NULL si es inmediata.';
COMMENT ON COLUMN publicacion.id_director_revisa IS 'Trazabilidad: Director que decide; NULL hasta decidir.';
COMMENT ON TABLE archivo_publicacion IS 'P1, P2. Imagenes de una publicacion (optimizadas a 600x400).';
COMMENT ON TABLE docente IS 'P3. Plana docente con ciclo de revision; los inactivos no se eliminan.';
COMMENT ON COLUMN docente.categoria_renacyt IS 'P3. Solo si es_investigador (CHECK).';
COMMENT ON COLUMN docente.encuadre_x IS 'P3. Encuadre horizontal de la fotografia definido por el editor.';
COMMENT ON COLUMN docente.encuadre_y IS 'P3. Encuadre vertical de la fotografia definido por el editor.';
COMMENT ON TABLE especialidad_docente IS 'P3. Especialidades del docente (atributo multivaluado).';
COMMENT ON TABLE consulta_contacto IS 'P4. Consultas del formulario de contacto, clasificadas y derivadas por Secretaria.';
COMMENT ON COLUMN consulta_contacto.id_departamento_responsable IS 'P4. NULL hasta clasificar.';
COMMENT ON TABLE plan_estudios IS 'P6. Versiones del plan de estudios (por anio y version) con ciclo de revision.';
COMMENT ON COLUMN plan_estudios.es_predeterminada IS 'P6. Version que se muestra al entrar; unica (indice parcial).';
COMMENT ON TABLE curso IS 'P6. Cursos de un plan; codigo unico por plan.';
COMMENT ON COLUMN curso.creditos IS 'P6. Dato de entrada validado, no derivado.';
COMMENT ON TABLE prerrequisito IS 'P6. Relacion curso-requisito; la ausencia de ciclos la valida la aplicacion.';
COMMENT ON TABLE documento_oficial IS 'P7. Resoluciones, guias y politicas con vigencia y versiones encadenadas.';
COMMENT ON COLUMN documento_oficial.id_version_anterior IS 'P7. Version que reemplaza; unica y NULL en la primera.';
COMMENT ON TABLE campana_admision IS 'P8. Campanas de admision; solo una vigente (indice parcial).';
COMMENT ON TABLE modalidad_admision IS 'P8. Modalidades de ingreso y vacantes de una campana.';
COMMENT ON TABLE cronograma_admision IS 'P8. Hitos con fecha de una campana.';
COMMENT ON TABLE registro_visita IS 'P9. Visitas anonimas por seccion publica, sin datos personales.';
