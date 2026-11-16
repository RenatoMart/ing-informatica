/**
 * Carga el contenido del sitio desde la API del portal y lo aplica sobre el perfil estático
 * (que queda como respaldo). Además implementa la «vista previa» del panel: cuando el sitio
 * se abre dentro de un iframe con `?preview=1`, acepta borradores por postMessage.
 */
import { aplicarClave, aplicarPerfil } from './hidratar';
// Copia del contenido publicado en el portal, que una GitHub Action mantiene al día (scripts/sync-respaldo.mjs).
import respaldoPublicado from '@profile/respaldo.json';

/* eslint-disable @typescript-eslint/no-explicit-any */
const env = import.meta.env;
const API_BASE: string = (env.VITE_API_URL ?? (env.DEV ? 'http://localhost:8080' : '')).replace(/\/$/, '');
/** Dirección de la API (las imágenes y archivos /media/… se piden allí). */
export const urlApi = API_BASE;
const SLUG: string = env.VITE_ESCUELA_SLUG ?? 'informatica';

/** Resultado de enviar el formulario de contacto. */
export type EnvioConsulta = 'ok' | 'limite' | 'invalido' | 'sin-conexion';

/**
 * Envía una consulta del formulario de contacto al portal (aparece en «Consultas» del panel).
 * `trampa` es un campo oculto que las personas dejan vacío: si llega con texto, es un bot.
 */
export async function enviarConsulta(d: { nombre: string; correo: string; asunto: string; mensaje: string; trampa: string }): Promise<EnvioConsulta> {
  if (!API_BASE) return 'sin-conexion';
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 20000); // el servidor puede estar despertando
  try {
    const r = await fetch(`${API_BASE}/api/v1/public/escuelas/${SLUG}/consultas`, {
      method: 'POST', signal: ctl.signal, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: d.nombre, correo: d.correo, asunto: d.asunto, mensaje: d.mensaje, sitio_web: d.trampa }),
    });
    if (r.ok) return 'ok';
    if (r.status === 429) return 'limite';
    if (r.status === 422 || r.status === 400) return 'invalido';
    return 'sin-conexion';
  } catch {
    return 'sin-conexion';
  } finally {
    clearTimeout(t);
  }
}
const ORIGENES_PANEL: string[] = (env.VITE_PANEL_ORIGINS ?? 'http://localhost:8080,http://localhost:5174,http://127.0.0.1:8080,http://127.0.0.1:5174')
  .split(',').map((s: string) => s.trim()).filter(Boolean);
const ESPERA_MAXIMA_MS = 1500;

const enIframe = () => {
  try { return window.parent !== window; } catch { return true; }
};
export const esVistaPrevia = () => new URLSearchParams(window.location.search).get('preview') === '1' && enIframe();

/** Las rutas /media/... de la API pasan a URL absolutas (el sitio puede estar en otro origen). */
function absolutizar(v: any): any {
  if (typeof v === 'string') return v.startsWith('/media/') ? API_BASE + v : v;
  if (Array.isArray(v)) return v.map(absolutizar);
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, absolutizar(x)]));
  return v;
}

async function pedirPerfil(sinCache: boolean, limiteMs?: number): Promise<Record<string, any> | null> {
  const ctl = new AbortController();
  const t = limiteMs ? setTimeout(() => ctl.abort(), limiteMs) : undefined;
  try {
    const r = await fetch(`${API_BASE}/api/v1/public/escuelas/${SLUG}/perfil`, { signal: ctl.signal, cache: sinCache ? 'no-cache' : 'default' });
    if (!r.ok) return null;
    return absolutizar(await r.json());
  } catch {
    return null;
  } finally {
    if (t) clearTimeout(t);
  }
}

/**
 * Arranque del sitio: espera el perfil hasta ESPERA_MAXIMA_MS; si no llega, el sitio se muestra con
 * el respaldo (respaldo.json, o profiles/ si aún no hay) y se vuelve a intentar en segundo plano.
 * No hace falta avisar a nadie: `aplicarPerfil` marca las secciones que cambian (almacen.ts) y React
 * vuelve a pintar solo eso, sin desmontar la página.
 */
export async function iniciarPerfilRemoto(): Promise<void> {
  const previa = esVistaPrevia();
  // Primero el respaldo (lo último publicado cuando se actualizó el repo); si la API responde, lo reemplaza.
  const instantanea = absolutizar(respaldoPublicado as Record<string, any>);
  if (instantanea && Object.keys(instantanea).length > 0) aplicarPerfil(instantanea);
  const perfil = await pedirPerfil(previa, ESPERA_MAXIMA_MS);
  if (perfil) aplicarPerfil(perfil);
  else {
    // Sin respuesta a tiempo: se muestra el respaldo y se reintenta una vez sin límite.
    pedirPerfil(previa).then((p) => { if (p) aplicarPerfil(p); });
  }
  if (previa) conectarVistaPrevia();
}

// ---- Vista previa ----

function conectarVistaPrevia(): void {
  window.addEventListener('message', (e: MessageEvent) => {
    if (!ORIGENES_PANEL.includes(e.origin) || e.source !== window.parent) return;
    const m = e.data;
    if (!m || m.fuente !== 'portal-panel') return;
    if (m.tipo === 'borrador' && typeof m.clave === 'string') {
      aplicarClave(m.clave, absolutizar(m.datos));
    } else if (m.tipo === 'recargar') {
      pedirPerfil(true).then((p) => { if (p) aplicarPerfil(p); });
    } else if (m.tipo === 'ir' && typeof m.ruta === 'string' && /^\/(?![/\\])/.test(m.ruta)) { // solo rutas internas: nunca «//otro-sitio»
      window.history.pushState(null, '', m.ruta);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  });
  // Avisa al panel (solo a los orígenes permitidos) de que ya puede enviar borradores.
  for (const origen of ORIGENES_PANEL) window.parent.postMessage({ fuente: 'portal-site', tipo: 'ready' }, origen);
}
