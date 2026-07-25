import type { BrandingConfig } from '@/profile-types';

// 1) Coloca los archivos en profiles/_template/assets/ (ver assets/README.md).
// 2) Descomenta los imports y referencia cada uno abajo.
// Ejemplo: profiles/escuela/config/branding.ts
// import logoUniversidad from '../assets/logo-universidad.png';
// import logoEscuela from '../assets/logo-escuela.png';
// import logoBolsa from '../assets/logo-bolsa-trabajo.png';
// import libroReclamaciones from '../assets/libro-reclamaciones.svg';
// import hero1 from '../assets/hero/hero-1.webp';
// import hero2 from '../assets/hero/hero-2.webp';
// import hero3 from '../assets/hero/hero-3.webp';

export const branding: BrandingConfig = {
  logos: {
    universidad: '', // logoUniversidad,
    escuela: '', // logoEscuela,
    bolsaTrabajo: '', // logoBolsa,
    libroReclamaciones: '', // libroReclamaciones,
  },
  heroImages: [], // [{ src: hero1, position: 'center 25%' }, { src: hero2, position: 'center 25%' }, { src: hero3, position: 'center 25%' }],
  alt: {
    universidad: '[Universidad]',
    escuela: '[Escuela]',
    bolsaTrabajo: 'Bolsa de trabajo',
  },
};
