/**
 * Contrato de un perfil de escuela (white-label).
 *
 * Cada escuela vive en `profiles/<slug>/` y debe satisfacer la interfaz `Profile`.
 * El perfil activo se resuelve en build-time vía el alias `@profile`
 * (ver `vite.config.ts`), por lo que crear una escuela nueva = añadir una carpeta,
 * sin tocar el código de `src/`.
 *
 * NOTA: el tema/colores NO se gestiona aquí; vive en `tailwind.config.js` (global).
 */

export interface CtaLink {
  label: string;
  to: string;
}

export interface HeroConfig {
  /** Etiqueta pequeña sobre el título (eyebrow). */
  eyebrow: string;
  /** Título a dos líneas (la 2.ª se pinta en dorado). */
  titulo: { linea1: string; linea2: string };
  descripcion: string;
  ctas: { primary: CtaLink; secondary: CtaLink };
}

export interface AcreditacionConfig {
  entidad: string;
  estado: 'acreditada' | 'en-proceso' | 'no-acreditada';
  /** Texto que muestra el sello en el hero. */
  texto: string;
  /** Si false, el sello no se renderiza. */
  mostrarSello: boolean;
}

export interface CifraItem {
  numero: string;
  etiqueta: string;
  sub: string;
}

export interface DecanaConfig {
  nombre: string;
  cargo: string;
  mensaje: string;
  video: { youtubeId: string; start?: number };
}

export interface SiteConfig {
  programa: { nombre: string; nombreCorto: string };
  universidad: {
    nombre: string;
    siglas: string;
    url?: string;
    /** Dominio para acotar el buscador del navbar (site:dominio). Vacío = búsqueda general. */
    dominio?: string;
  };
  facultad?: string;
  /** Denominación del tipo de unidad académica (p. ej. "Programa de Estudios"). */
  denominacion: string;
  /** Marca tipográfica del navbar, a dos líneas (azul / dorado). */
  wordmark: { linea1: string; linea2: string };
  /** Frase breve de identidad (footer). */
  tagline: string;
  hero: HeroConfig;
  acreditacion: AcreditacionConfig;
  cifras: CifraItem[];
  decana: DecanaConfig;
  enlaces: {
    libroReclamaciones: string;
    bolsaTrabajo: string;
  };
  /** Enlaces a portales institucionales (footer). */
  enlacesInstitucionales: { label: string; url: string }[];
}

export interface BrandingConfig {
  /** Rutas resueltas por Vite a partir de los imports del perfil. */
  logos: {
    universidad: string;
    escuela: string;
    bolsaTrabajo: string;
    libroReclamaciones: string;
  };
  /** Imágenes de fondo del hero (carrusel, máx. recomendado 3). `position` es
   *  el CSS object-position de esa foto (ej. 'center 25%'); opcional, cada
   *  foto puede necesitar un encuadre distinto según dónde quede lo importante. */
  heroImages: { src: string; position?: string }[];
  /** Textos alternativos de las marcas (accesibilidad). */
  alt: {
    universidad: string;
    escuela: string;
    bolsaTrabajo: string;
  };
}

export interface SeoConfig {
  title: string;
  description: string;
  lang: string;
}

export interface Profile {
  site: SiteConfig;
  branding: BrandingConfig;
  seo: SeoConfig;
}

// ── Navegación ──────────────────────────────────────────────────────────────
// Los datos de navegación (NAV_LINKS, ADMISION_GROUPS) viven en el perfil
// (config/navigation.ts); los helpers de recorrido son del sistema (src/navigation.ts).

/** Una entrada navegable (página o, dentro de `navAs`, una etiqueta con ancla). */
export interface NavLeaf {
  name: string;
  path: string;
  external?: boolean;
  navAs?: NavLeaf[];
}

/** Subcategoría de un desplegable: una etiqueta con sus items. */
export interface NavGroup {
  label: string;
  items: NavLeaf[];
}

/** Sección del menú principal; puede tener grupos (desplegable) o no (enlace simple). */
export interface NavSection {
  name: string;
  path: string;
  groups?: NavGroup[];
}
