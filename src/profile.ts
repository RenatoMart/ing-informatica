/**
 * Punto único desde el que el sistema (componentes/páginas) consume el perfil
 * activo. NUNCA importar de `profiles/...` directamente: importar siempre de aquí.
 *
 * El perfil activo se elige en build-time con la variable de entorno `PROFILE`
 * (alias `@profile` en `vite.config.ts`). Por defecto: `escuela`.
 */
import profile from '@profile';

export default profile;
export const { site, branding, seo } = profile;

/**
 * Nombre corto del sitio para títulos de pestaña (`document.title`), p. ej.
 * "Nombre de la Escuela · SIGLAS". Derivado del perfil, no hardcodeado.
 */
const componerSiteName = () => `${site.programa.nombreCorto} · ${site.universidad.siglas}`;
export let siteName = componerSiteName();

/** Lo llama el cargador remoto (src/data) tras aplicar datos nuevos. */
export function actualizarSiteName(): void {
  siteName = componerSiteName();
}
