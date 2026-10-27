-- =====================================================================
-- 20_vistas.sql - Vistas publicas (DISENO_BACKEND 4.8). CREATE OR REPLACE VIEW.
-- v_rev_pendientes NO se define aqui: vive en 10_sp_comunes.sql (B2a).
-- Las vistas publicas no exponen datos de editores/revisores.
-- =====================================================================

-- Publicaciones visibles (estado publicada y fecha de visibilidad ya alcanzada).
CREATE OR REPLACE VIEW v_publico_publicaciones AS
SELECT p.id_publicacion,
       p.titulo,
       p.resumen,
       p.contenido,
       p.categoria,
       COALESCE(p.fecha_publicacion_programada, p.fecha_decision::date) AS fecha_visible,
       (SELECT a.ruta_archivo FROM archivo_publicacion a
         WHERE a.id_publicacion = p.id_publicacion ORDER BY a.id_archivo LIMIT 1) AS imagen_portada,
       COALESCE((SELECT jsonb_agg(jsonb_build_object('id_archivo', a.id_archivo, 'ruta_archivo', a.ruta_archivo,
                                                     'ancho_px', a.ancho_px, 'alto_px', a.alto_px)
                                  ORDER BY a.id_archivo)
                   FROM archivo_publicacion a WHERE a.id_publicacion = p.id_publicacion), '[]'::jsonb) AS archivos
  FROM publicacion p
 WHERE p.estado = 'publicada'
   AND COALESCE(p.fecha_publicacion_programada, p.fecha_decision::date) <= current_date;

-- Docentes publicados con departamento y especialidades ordenadas.
CREATE OR REPLACE VIEW v_publico_docentes AS
SELECT d.id_docente,
       d.nombres,
       d.apellidos,
       d.grado_academico,
       d.id_departamento,
       dp.nombre AS departamento,
       d.curso_principal,
       d.condicion_laboral::text AS condicion_laboral,
       d.es_investigador,
       d.categoria_renacyt,
       d.ruta_fotografia,
       d.encuadre_x,
       d.encuadre_y,
       COALESCE((SELECT array_agg(e.especialidad ORDER BY e.especialidad)
                   FROM especialidad_docente e WHERE e.id_docente = d.id_docente), ARRAY[]::varchar[]) AS especialidades
  FROM docente d
  JOIN departamento dp ON dp.id_departamento = d.id_departamento
 WHERE d.estado = 'publicado';

-- Departamentos con su cantidad de docentes publicados (filtro ?con_docentes=1).
CREATE OR REPLACE VIEW v_publico_departamentos AS
SELECT dp.id_departamento,
       dp.nombre,
       (SELECT count(*) FROM docente d WHERE d.id_departamento = dp.id_departamento AND d.estado = 'publicado')::int AS total_docentes
  FROM departamento dp;

-- Planes de estudio consultables (vigente + historico).
CREATE OR REPLACE VIEW v_publico_planes AS
SELECT p.id_plan, p.anio, p.version, p.estado::text AS estado, p.es_predeterminada,
       p.archivo_pdf_plan, p.archivo_pdf_resolucion, p.fecha_publicacion
  FROM plan_estudios p
 WHERE p.estado IN ('vigente', 'historico');

-- Cursos de los planes publicos.
CREATE OR REPLACE VIEW v_publico_cursos AS
SELECT c.id_curso, c.id_plan, c.codigo, c.nombre, c.creditos, c.tipo::text AS tipo, c.ciclo,
       c.area_formacion, c.horas_teoria, c.horas_practica, c.descripcion
  FROM curso c
  JOIN plan_estudios p ON p.id_plan = c.id_plan
 WHERE p.estado IN ('vigente', 'historico');

-- Aristas de prerrequisito (codigo_requerido -> codigo_curso) de los planes publicos.
CREATE OR REPLACE VIEW v_publico_prerrequisitos AS
SELECT c.id_plan,
       r.id_curso,
       c.codigo AS codigo_curso,
       r.id_curso_requerido,
       q.codigo AS codigo_requerido
  FROM prerrequisito r
  JOIN curso c ON c.id_curso = r.id_curso
  JOIN curso q ON q.id_curso = r.id_curso_requerido
  JOIN plan_estudios p ON p.id_plan = c.id_plan
 WHERE p.estado IN ('vigente', 'historico');

-- Documentos oficiales vigentes e historicos (el backend filtra los historicos con ?historicos=1).
CREATE OR REPLACE VIEW v_publico_documentos AS
SELECT d.id_documento, d.tipo::text AS tipo, d.numero, d.titulo, d.fecha_emision, d.fecha_vigencia,
       d.archivo_pdf, d.estado::text AS estado, d.id_departamento_emisor AS id_departamento,
       dp.nombre AS departamento, d.id_version_anterior
  FROM documento_oficial d
  JOIN departamento dp ON dp.id_departamento = d.id_departamento_emisor
 WHERE d.estado IN ('vigente', 'historico');

-- Campana de admision vigente (0 o 1 fila) con modalidades y cronograma en JSON.
CREATE OR REPLACE VIEW v_publico_campana_vigente AS
SELECT c.id_campana, c.anio, c.proceso, c.fecha_inicio, c.fecha_fin, c.url_portal, c.url_estadisticas,
       COALESCE((SELECT jsonb_agg(jsonb_build_object('id_modalidad', m.id_modalidad, 'nombre', m.nombre,
                                                     'dirigido_a', m.dirigido_a, 'vacantes', m.vacantes,
                                                     'descripcion', m.descripcion) ORDER BY m.id_modalidad)
                   FROM modalidad_admision m WHERE m.id_campana = c.id_campana), '[]'::jsonb) AS modalidades,
       COALESCE((SELECT jsonb_agg(jsonb_build_object('id_hito', h.id_hito, 'hito', h.hito, 'fecha', h.fecha)
                                  ORDER BY h.fecha, h.id_hito)
                   FROM cronograma_admision h WHERE h.id_campana = c.id_campana), '[]'::jsonb) AS cronograma
  FROM campana_admision c
 WHERE c.estado = 'vigente';
