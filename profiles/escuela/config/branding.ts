import type { BrandingConfig } from '@/profile-types';

// Recursos gráficos de ESTA escuela, dentro del propio perfil
// (`profiles/escuela/assets/`). El branding gestiona las
// referencias por rol; no existe un assets.ts global.
import logoUniversidad from '../assets/logo-universidad.png';
import logoEscuela from '../assets/logo-escuela.png';
import logoBolsa from '../assets/logo-bolsa-trabajo.png';
import libroReclamaciones from '../assets/libro-reclamaciones.svg';
import hero1 from '../assets/hero/hero-1.jpeg';
import hero2 from '../assets/hero/hero-2.jpg';
import hero3 from '../assets/hero/hero-3.jpg';

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
  heroImages: [
    { src: hero1, position: 'center 25%' },
    { src: hero2, position: 'center 25%' },
    { src: hero3, position: 'center 50%' },
  ],
  alt: {
    universidad: 'Nombre de la Universidad',
    escuela: 'Nombre del Programa de Estudios',
    bolsaTrabajo: 'Bolsa de trabajo',
  },
};
