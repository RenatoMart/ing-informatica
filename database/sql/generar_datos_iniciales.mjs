// Genera database/sql/03_datos_iniciales.sql a partir del contenido estatico del front.
// Uso: node database/sql/generar_datos_iniciales.mjs
// Las contrasenas temporales se crean la primera vez y se guardan en
// docs/CREDENCIALES_INICIALES.md (ignorado por git); en corridas siguientes se reutilizan.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const content = path.join(root, 'profiles/escuela/content');
const read = (f) => fs.readFileSync(path.join(content, f), 'utf8');
const q = (v) => (v === null || v === undefined ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`);

// Evalua un literal de arreglo exportado de un .ts (sin tipos en el cuerpo).
function arrayLiteral(src, name) {
  const start = src.indexOf(`export const ${name}`);
  const open = src.indexOf('= [', start) + 2;
  let depth = 0, i = open;
  for (; i < src.length; i++) {
    if (src[i] === '[') depth++;
    else if (src[i] === ']' && --depth === 0) break;
  }
  return new Function(`return ${src.slice(open, i + 1)}`)();
}

// ---------- credenciales ----------
const credFile = path.join(root, 'docs/CREDENCIALES_INICIALES.md');
const usuarios = [
  { rol: 'Administrador', nombres: 'Administrador', apellidos: 'del Portal', correo: 'admin@informatica.local' },
  { rol: 'Revisor', nombres: 'Edwin Ricardo', apellidos: 'Mendoza Torres', correo: 'director.escuela@informatica.local' },
  { rol: 'Editor', nombres: 'Secretaría', apellidos: 'Escuela de Informática', correo: 'secretaria@informatica.local' },
];
const previas = {};
if (fs.existsSync(credFile)) {
  for (const m of fs.readFileSync(credFile, 'utf8').matchAll(/^\|\s*(\S+@\S+)\s*\|\s*`([^`]+)`\s*\|/gm)) previas[m[1]] = m[2];
}
const nueva = () => crypto.randomBytes(12).toString('base64url') + '#9a';
for (const u of usuarios) {
  u.clave = previas[u.correo] ?? nueva();
  u.hash = execFileSync('php', ['-r', 'echo password_hash($argv[1], PASSWORD_BCRYPT);', u.clave]).toString().trim();
}
fs.writeFileSync(credFile,
`# Credenciales iniciales (TEMPORALES)

Archivo ignorado por git. Cada cuenta tiene \`debe_cambiar_contrasena = true\`: cambiar la clave en el primer inicio de sesion.
Los correos son de ejemplo (\`@informatica.local\`); reemplazar por los institucionales reales.

| Correo | Contrasena temporal | Rol |
|---|---|---|
${usuarios.map((u) => `| ${u.correo} | \`${u.clave}\` | ${u.rol} |`).join('\n')}
`);

// ---------- contenido del front ----------
const docentes = arrayLiteral(read('docentes.ts'), 'docentes');
const malla = read('malla.ts');
const cursos = arrayLiteral(malla.replace(/^import .*$/m, ''), 'CURRICULUM_DATA');
const edges = [...malla.matchAll(/source:\s*'([^']+)',\s*target:\s*'([^']+)'/g)].map((m) => ({ req: m[1], curso: m[2] }));
const adm = read('admision.ts');
const modalidades = arrayLiteral(adm, 'modalidadesAdmision');
const portalUrl = adm.match(/url:\s*'([^']+)'/)[1];

const D = 'Departamento Académico de Informática';
const ED = `(SELECT id_usuario FROM usuario WHERE correo_institucional='secretaria@informatica.local')`;
const DIR = `(SELECT id_usuario FROM usuario WHERE correo_institucional='director.escuela@informatica.local')`;
const DEP = `(SELECT id_departamento FROM departamento WHERE nombre=${q(D)})`;
const out = [];
const w = (s = '') => out.push(s);

w('-- Generado por database/sql/generar_datos_iniciales.mjs. NO editar a mano.');
w('-- Idempotente: se puede reaplicar sin duplicar filas.');
w('BEGIN;');
w('\n-- ROLES');
w(`INSERT INTO rol (nombre, descripcion) VALUES
 ('Editor', 'Editor de contenidos (Secretaría)'),
 ('Revisor', 'Revisor: Director de Escuela, aprueba o rechaza el contenido'),
 ('Administrador', 'Administrador: gestiona usuarios, roles y accesos')
ON CONFLICT (nombre) DO NOTHING;`);

w('\n-- DEPARTAMENTOS');
w(`INSERT INTO departamento (nombre) VALUES (${q(D)}) ON CONFLICT (nombre) DO NOTHING;`);

w('\n-- USUARIOS (contrasenas temporales en docs/CREDENCIALES_INICIALES.md)');
for (const u of usuarios) {
  w(`INSERT INTO usuario (nombres, apellidos, correo_institucional, contrasena_hash, id_rol, estado, debe_cambiar_contrasena)
VALUES (${q(u.nombres)}, ${q(u.apellidos)}, ${q(u.correo)}, ${q(u.hash)}, (SELECT id_rol FROM rol WHERE nombre=${q(u.rol)}), 'activo', TRUE)
ON CONFLICT (correo_institucional) DO NOTHING;`);
}

w('\n-- DOCENTES (docentes.ts). supuesto: condicion_laboral solo donde el front la define; grado "Docente" no es un grado -> NULL');
for (const d of docentes) {
  const p = d.nombre.split(' ');
  const apellidos = p.slice(-2).join(' ');
  const nombres = p.slice(0, -2).join(' ');
  const grado = d.grado === 'Docente' ? null : d.grado;
  const cond = d.condicion ? d.condicion.toLowerCase() : null;
  const reno = d.investigador ? d.categoriaInvestigacion ?? null : null;
  w(`INSERT INTO docente (nombres, apellidos, grado_academico, id_departamento, curso_principal, condicion_laboral, es_investigador, categoria_renacyt, estado, id_editor, id_director_revisa, fecha_decision)
SELECT ${q(nombres)}, ${q(apellidos)}, ${q(grado)}, ${DEP}, ${q(d.cursoPrincipal)}, ${cond ? q(cond) + '::condicion_laboral' : 'NULL'}, ${!!d.investigador}, ${q(reno)}, 'publicado', ${ED}, ${DIR}, now()
WHERE NOT EXISTS (SELECT 1 FROM docente WHERE nombres=${q(nombres)} AND apellidos=${q(apellidos)});`);
  for (const e of d.especialidades ?? []) {
    w(`INSERT INTO especialidad_docente (id_docente, especialidad) SELECT id_docente, ${q(e)} FROM docente WHERE nombres=${q(nombres)} AND apellidos=${q(apellidos)} ON CONFLICT DO NOTHING;`);
  }
}

w('\n-- PLAN DE ESTUDIOS 2018 (malla.ts, R.C.U. 065-2018/UNT). supuesto: version "1.0"; sin PDF de plan/resolucion en el repo');
w(`INSERT INTO plan_estudios (anio, version, estado, es_predeterminada, fecha_publicacion, id_editor, id_director_revisa, fecha_decision)
VALUES (2018, '1.0', 'vigente', TRUE, now(), ${ED}, ${DIR}, now())
ON CONFLICT (anio, version) DO NOTHING;`);
const PLAN = `(SELECT id_plan FROM plan_estudios WHERE anio=2018 AND version='1.0')`;
const roman = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10 };
const area = { general: 'Estudios Generales', especifico: 'Estudios Específicos', especialidad: 'Estudios de Especialidad' };
for (const c of cursos) {
  w(`INSERT INTO curso (id_plan, codigo, nombre, creditos, tipo, ciclo, area_formacion) VALUES (${PLAN}, ${q(c.id)}, ${q(c.name)}, ${c.credits}, '${c.isElective ? 'electivo' : 'obligatorio'}', ${roman[c.cycle.replace('Ciclo ', '')]}, ${q(area[c.type])}) ON CONFLICT (id_plan, codigo) DO NOTHING;`);
}
const cid = (cod) => `(SELECT id_curso FROM curso WHERE id_plan=${PLAN} AND codigo=${q(cod)})`;
for (const e of edges) {
  w(`INSERT INTO prerrequisito (id_curso, id_curso_requerido) VALUES (${cid(e.curso)}, ${cid(e.req)}) ON CONFLICT DO NOTHING;`);
}

w('\n-- DOCUMENTOS OFICIALES (PDF de docs/). supuesto: numero, fecha_emision y vigencia (+5 anios) no constan en el front');
const docs = [
  { tipo: 'guia', numero: 'GUIA-BACHILLER', archivo: 'docs/TRAMITE PARA OBTENER GRADO BACHILLER.pdf' },
  { tipo: 'guia', numero: 'GUIA-TITULO-EDUC-PRIMARIA', archivo: 'docs/TRAMITE PARA TITULO - EDUCACION PRIMARIA.pdf' },
];
for (const d of docs) {
  if (!fs.existsSync(path.join(root, d.archivo))) continue;
  w(`INSERT INTO documento_oficial (tipo, numero, fecha_emision, id_departamento_emisor, fecha_vigencia, archivo_pdf, estado, id_editor, id_director_revisa, fecha_decision)
SELECT '${d.tipo}', ${q(d.numero)}, CURRENT_DATE, ${DEP}, CURRENT_DATE + INTERVAL '5 years', ${q(d.archivo)}, 'vigente', ${ED}, ${DIR}, now()
WHERE NOT EXISTS (SELECT 1 FROM documento_oficial WHERE tipo='${d.tipo}' AND numero=${q(d.numero)});`);
}

w('\n-- CAMPANA DE ADMISION 2027-I (admision.ts). supuesto: fecha_inicio/fin = inscripcion virtual 15/06-08/08/2026 ... examen 23/08/2026');
w(`INSERT INTO campana_admision (anio, proceso, estado, fecha_inicio, fecha_fin, url_portal, id_editor, id_director_revisa, fecha_decision)
SELECT 2027, 'I', 'vigente', DATE '2026-06-15', DATE '2026-08-23', ${q(portalUrl)}, ${ED}, ${DIR}, now()
WHERE NOT EXISTS (SELECT 1 FROM campana_admision WHERE anio=2027 AND proceso='I');`);
const CAMP = `(SELECT id_campana FROM campana_admision WHERE anio=2027 AND proceso='I')`;
for (const m of modalidades) {
  const vac = parseInt(m.vacantes, 10);
  w(`INSERT INTO modalidad_admision (id_campana, nombre, dirigido_a, vacantes, descripcion)
SELECT ${CAMP}, ${q(m.titulo)}, ${q(m.dirigidoA)}, ${vac}, ${q(m.descripcion)}
WHERE NOT EXISTS (SELECT 1 FROM modalidad_admision WHERE id_campana=${CAMP} AND nombre=${q(m.titulo)});`);
}
// Hitos tomados de infoUtilAdmision ("Fechas (Admision 2027-I)")
const hitos = [
  ['Inicio de inscripción virtual (Ordinario y Quinto de Secundaria)', '2026-06-15'],
  ['Cierre de inscripción virtual', '2026-08-08'],
  ['Examen presencial Ordinario (día 1)', '2026-08-22'],
  ['Examen presencial Ordinario (día 2)', '2026-08-23'],
  ['CEPUNT-I: primera evaluación sumativa', '2026-05-24'],
  ['CEPUNT-I: segunda evaluación sumativa', '2026-06-28'],
  ['CEPUNT-I: tercera evaluación sumativa', '2026-08-02'],
];
for (const [h, f] of hitos) {
  w(`INSERT INTO cronograma_admision (id_campana, hito, fecha)
SELECT ${CAMP}, ${q(h)}, DATE ${q(f)}
WHERE NOT EXISTS (SELECT 1 FROM cronograma_admision WHERE id_campana=${CAMP} AND hito=${q(h)});`);
}
w('\n-- noticias.ts, avisos.ts y home.ts solo contienen texto de relleno ("Título de la noticia 1"): no se migran.');
w('COMMIT;');

fs.writeFileSync(path.join(root, 'database/sql/03_datos_iniciales.sql'), out.join('\n') + '\n');
console.log('OK: 03_datos_iniciales.sql y docs/CREDENCIALES_INICIALES.md');
