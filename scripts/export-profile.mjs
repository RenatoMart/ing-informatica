// Vuelca profiles/<perfil>/ a seed/<slug>.json + seed/assets/ para el backend en Go.
// Uso: node scripts/export-profile.mjs [perfil=escuela] [destino=../../GolandProjects/informatica-back/seed]
import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const raiz = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const perfil = process.argv[2] ?? 'escuela';
const destino = path.resolve(process.argv[3] ?? path.join(raiz, '../../GolandProjects/informatica-back/seed'));
const dir = path.join(raiz, 'profiles', perfil);
const tmp = path.join(raiz, 'node_modules/.cache/export-profile');
fs.mkdirSync(tmp, { recursive: true });

const modulos = {
  site: 'config/site.ts', branding: 'config/branding.ts', seo: 'config/seo.ts', navigation: 'config/navigation.ts',
  academico: 'content/academico.ts', admision: 'content/admision.ts', autoridades: 'content/autoridades.ts',
  contacto: 'content/contacto.ts', docentes: 'content/docentes.ts', home: 'content/home.ts',
  identidad: 'content/identidad.ts', investigacion: 'content/investigacion.ts', malla: 'content/malla.ts',
};

// Las imágenes/PDF importados pasan a ser "asset:<ruta relativa al repo>".
const plugin = {
  name: 'assets',
  setup(b) {
    b.onResolve({ filter: /\.(png|jpe?g|webp|svg|gif|pdf)$/ }, (a) => ({ path: path.resolve(a.resolveDir, a.path), namespace: 'asset' }));
    b.onLoad({ filter: /.*/, namespace: 'asset' }, (a) => ({
      contents: `export default ${JSON.stringify('asset:' + path.relative(raiz, a.path).split(path.sep).join('/'))}`, loader: 'js',
    }));
  },
};

const entrada = Object.entries(modulos).map(([k, f]) => `export * as ${k} from ${JSON.stringify(path.join(dir, f))};`).join('\n')
  + `\nexport * as lucide from 'lucide-react';`;
const salida = path.join(tmp, 'bundle.mjs');
await build({
  stdin: { contents: entrada, resolveDir: raiz, loader: 'ts' }, bundle: true, format: 'esm', platform: 'node',
  outfile: salida, plugins: [plugin], logLevel: 'error',
  define: { 'import.meta.env.BASE_URL': '"asset:public/"', 'process.env.NODE_ENV': '"production"' },
  banner: { js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);" },
});
const m = await import(pathToFileURL(salida).href + '?t=' + Date.now());

// ---- utilidades ----
const nombreIcono = (comp) => {
  const iguales = Object.keys(m.lucide).filter((k) => m.lucide[k] === comp);
  return iguales.find((k) => !k.startsWith('Lucide') && !k.endsWith('Icon')) ?? iguales[0] ?? '';
};
const limpiar = (v) => {
  if (Array.isArray(v)) return v.map(limpiar);
  if (v && typeof v === 'object') {
    return Object.fromEntries(Object.entries(v).filter(([, x]) => x !== null && x !== undefined && typeof x !== 'function').map(([k, x]) => [k, limpiar(x)]));
  }
  return v;
};
const quitar = (obj, claves) => Object.fromEntries(Object.entries(obj).filter(([k]) => !claves.includes(k)));
const romano = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10, XI: 11, XII: 12 };

const { site, branding, seo } = { site: m.site.site, branding: m.branding.branding, seo: m.seo.seo };

// Comités: hoy escritos en src/pages/organizacion/Comites.tsx
const textoComites = fs.readFileSync(path.join(raiz, 'src/pages/organizacion/Comites.tsx'), 'utf8');
const comites = [...textoComites.matchAll(/\{ id: '([^']+)', titulo: '([^']+)'(?:, descripcion: '([^']+)')? \}/g)]
  .map((x) => ({ id: x[1], titulo: x[2], ...(x[3] ? { descripcion: x[3] } : {}) }));

// ---- contenido por ámbito ----
const universidad = {
  site: { universidad: site.universidad, enlaces: site.enlaces, enlacesInstitucionales: site.enlacesInstitucionales },
  branding: {
    logos: { universidad: branding.logos.universidad, libroReclamaciones: branding.logos.libroReclamaciones, bolsaTrabajo: branding.logos.bolsaTrabajo },
    alt: { universidad: branding.alt.universidad, bolsaTrabajo: branding.alt.bolsaTrabajo },
  },
  identidad: { misionUnt: m.identidad.misionUnt, visionUnt: m.identidad.visionUnt, objetivosEducacionalesUnt: m.identidad.objetivosEducacionalesUnt },
  investigacion: { conveniosOrni: m.investigacion.conveniosOrni },
};
const facultad = {
  site: { facultad: site.facultad },
  autoridades: { decano: m.autoridades.decano },
};
const escuela = {
  site: quitar(site, ['universidad', 'enlaces', 'enlacesInstitucionales', 'facultad']),
  branding: { logos: { escuela: branding.logos.escuela }, heroImages: branding.heroImages, alt: { escuela: branding.alt.escuela } },
  seo,
  navegacion: { menu: m.navigation.NAV_LINKS, admision: m.navigation.ADMISION_GROUPS },
  // Los avisos y datos de relleno ("Título de la noticia 1"...) no se siembran: se cargan desde el panel.
  avisos: { items: [] },
  home: {
    accesosRapidos: m.home.accesosRapidos.map((a) => ({ ...a, icono: nombreIcono(a.icono) })),
    ambientes: m.home.ambientes,
  },
  identidad: {
    mision: m.identidad.mision, vision: m.identidad.vision, valores: m.identidad.valores, historia: m.identidad.historia,
    objetivosEducacionales: m.identidad.objetivosEducacionales, objetivosAcademicos: m.identidad.objetivosAcademicos,
  },
  autoridades: { director: m.autoridades.director, directorDepartamento: m.autoridades.directorDepartamento, coordinadores: [], organigrama: m.autoridades.organigrama },
  academico: quitar(m.academico, ['movilidadX']),
  investigacion: {
    lineasInvestigacion: m.investigacion.lineasInvestigacion, proyectos: [], publicaciones: [],
    revistas: m.investigacion.revistas, convenios: [],
  },
  admision: { modalidades: m.admision.modalidadesAdmision, infoUtil: m.admision.infoUtilAdmision, portal: m.admision.portalAdmision },
  contacto: { informacion: m.contacto.informacionContacto, redes: m.contacto.redesSociales },
  comites: { items: comites },
  paginas: {
    'organizacion/administrativos': false, 'academico/laboratorios': false, 'academico/responsabilidad-social': false,
    'admision/guia': false, 'admision/resoluciones': false,
  },
};
// El módulo academico exporta funciones/constantes sueltas; se toma solo lo editable.
escuela.academico = Object.fromEntries(
  ['gradoAcademico', 'tituloProfesional', 'perfilIngresante', 'perfilEgresado', 'titulacion', 'tramites', 'movilidad', 'perspectivasOcupacionales']
    .map((k) => [k, m.academico[k]]));

// ---- plan de estudios ----
const requisitos = {};
for (const e of m.malla.PREREQUISITES_EDGES) (requisitos[e.target] ??= []).push(e.source);
const plan = {
  anio: 2018, version: '1.0', nombre: 'Plan de estudios 2018',
  cursos: m.malla.CURRICULUM_DATA.map((c) => ({
    codigo: c.id, nombre: c.name, area: c.type, creditos: c.credits, horasTeoria: c.hoursT, horasPractica: c.hoursP,
    ciclo: romano[c.cycle.replace('Ciclo ', '')], electivo: c.isElective, descripcion: c.description, requisitos: requisitos[c.id] ?? [],
  })),
};

const semilla = limpiar({
  universidad: { slug: 'unt', nombre: site.universidad.nombre, siglas: site.universidad.siglas },
  facultad: { slug: 'fcfym', nombre: site.facultad },
  escuela: { slug: 'informatica', nombre: site.programa.nombre, dominio: site.universidad.dominio },
  contenido: { universidad, facultad, escuela },
  docentes: m.docentes.docentes,
  plan,
});

// ---- archivos referenciados ----
const refs = new Set();
JSON.stringify(semilla, (k, v) => { if (typeof v === 'string' && v.startsWith('asset:')) refs.add(v.slice(6)); return v; });
fs.mkdirSync(path.join(destino, 'assets'), { recursive: true });
let copiados = 0; const faltan = [];
for (const rel of refs) {
  const origen = path.join(raiz, rel);
  if (!fs.existsSync(origen)) { faltan.push(rel); continue; }
  const dst = path.join(destino, 'assets', rel);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(origen, dst);
  copiados++;
}
fs.writeFileSync(path.join(destino, 'informatica.json'), JSON.stringify(semilla, null, 1));
console.log(`seed: ${destino}/informatica.json`);
console.log(`docentes: ${semilla.docentes.length}, cursos: ${plan.cursos.length}, comités: ${comites.length}`);
console.log(`archivos copiados: ${copiados}${faltan.length ? ', FALTAN: ' + faltan.join(', ') : ''}`);
const sinIcono = semilla.contenido.escuela.home.accesosRapidos.filter((a) => !a.icono).length;
if (sinIcono) console.log(`AVISO: ${sinIcono} accesos sin ícono resuelto`);
