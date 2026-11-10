// Baja el perfil público de la escuela desde el portal (API) y lo guarda en profiles/<perfil>/respaldo.json.
// Ese archivo es el RESPALDO que el sitio muestra si la API no responde. Lo ejecuta una GitHub Action
// (.github/workflows/sincronizar-respaldo.yml), pero también se puede correr a mano:
//   API_URL=https://api.unitru.edu.pe ESCUELA_SLUG=informatica node scripts/sync-respaldo.mjs
import fs from 'node:fs';
import path from 'node:path';

const api = (process.env.API_URL ?? '').replace(/\/$/, '');
const slug = process.env.ESCUELA_SLUG ?? 'informatica';
const perfil = process.env.PERFIL ?? 'escuela';
if (!api) {
  console.error('Falta API_URL (dirección del backend, p. ej. https://api.unitru.edu.pe).');
  process.exit(1);
}
if (!/^[a-z0-9-]+$/.test(slug) || !/^[a-zA-Z0-9_-]+$/.test(perfil)) {
  console.error('ESCUELA_SLUG o PERFIL con caracteres no permitidos.');
  process.exit(1);
}

const raiz = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const destino = path.join(raiz, 'profiles', perfil, 'respaldo.json');

const ctl = new AbortController();
const t = setTimeout(() => ctl.abort(), 30_000);
let datos;
try {
  const r = await fetch(`${api}/api/v1/public/escuelas/${slug}/perfil`, { signal: ctl.signal, headers: { Accept: 'application/json' } });
  if (!r.ok) throw new Error(`la API respondió ${r.status}`);
  datos = await r.json();
} catch (e) {
  console.error(`No se pudo bajar el perfil de «${slug}»: ${e.message}. Se conserva el respaldo anterior.`);
  process.exit(1);
} finally {
  clearTimeout(t);
}

// Nunca se reemplaza un respaldo bueno por una respuesta vacía o rara.
const claves = ['site', 'identidad', 'contacto', 'home'];
if (!datos || typeof datos !== 'object' || Array.isArray(datos) || claves.some((k) => !(k in datos))) {
  console.error('La respuesta no parece un perfil completo; no se modifica el respaldo.');
  process.exit(1);
}

// Claves ordenadas: así Git solo muestra cambios reales de contenido.
const ordenar = (v) => Array.isArray(v) ? v.map(ordenar)
  : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, ordenar(v[k])])) : v;
const nuevo = JSON.stringify(ordenar(datos), null, 2) + '\n';
const anterior = fs.existsSync(destino) ? fs.readFileSync(destino, 'utf8') : '';
if (nuevo === anterior) {
  console.log(`Sin cambios: el respaldo de «${slug}» ya está al día.`);
} else {
  fs.writeFileSync(destino, nuevo);
  console.log(`Respaldo de «${slug}» actualizado (${(nuevo.length / 1024).toFixed(1)} KB) → ${path.relative(raiz, destino)}`);
}
