import type { BrandingConfig } from '@/profile-types';

// Recursos gráficos de ESTA escuela, dentro del propio perfil
// (`profiles/escuela/assets/`). El branding gestiona las
// referencias por rol; no existe un assets.ts global.
import logoUniversidad from '../assets/logo-universidad.png';
import logoEscuela from '../assets/logo-escuela.svg';
import logoBolsa from '../assets/logo-bolsa-trabajo.png';
import libroReclamaciones from '../assets/libro-reclamaciones.svg';
import heroFrontis from '../assets/hero/frontis-escuela.webp';
import heroPortada from '../assets/hero/unt-portada.webp';

export const branding: BrandingConfig = {
  logos: {
    universidad: logoUniversidad,
    escuela: logoEscuela,
    bolsaTrabajo: logoBolsa,
    libroReclamaciones,
  },
  // "position" ajusta el encuadre de cada foto (CSS object-position). Súbela
  // (menos %) si tapa lo importante por abajo, bájala (más %) si lo tapa por
  // arriba. 'center 25%' = 25% de la altura de la foto desde arriba.
  // Fuente: fotos reales de inf.unitru.edu.pe (frontis del pabellón de
  // Informática y portada de la UNT). Agrega una tercera si consigues otra.
  heroImages: [
    { src: heroFrontis, position: 'center 40%' },
    { src: heroPortada, position: 'center 40%' },
  ],
  alt: {
    universidad: 'Universidad Nacional de Trujillo',
    escuela: 'Escuela Profesional de Informática - UNT',
    bolsaTrabajo: 'Bolsa de trabajo',
  },
};
