import type { SiteConfig } from '@/profile-types';

// Plantilla en blanco. Rellena los valores entre [corchetes].
// Ejemplo completo y funcional: profiles/escuela/config/site.ts
export const site: SiteConfig = {
  programa: { nombre: 'Escuela Profesional de [NOMBRE]', nombreCorto: '[Nombre corto]' },
  universidad: { nombre: '[Universidad]', siglas: '[SIGLAS]', url: 'https://', dominio: '' },
  facultad: 'Facultad de [Facultad]',

  denominacion: 'Programa de Estudios',

  wordmark: { linea1: '[Palabra 1]', linea2: '[Palabra 2]' },

  tagline: '[Frase breve de identidad para el footer].',

  hero: {
    eyebrow: 'Escuela Profesional de',
    titulo: { linea1: '[Palabra 1]', linea2: '[Palabra 2]' },
    descripcion: '[Descripción del hero, 1-2 líneas].',
    ctas: {
      primary: { label: 'Ver Plan de Estudios', to: '/academico/malla-curricular' },
      secondary: { label: 'Perfiles académicos', to: '/academico/perfiles' },
    },
  },

  acreditacion: {
    entidad: '[Entidad acreditadora]',
    estado: 'en-proceso',
    texto: 'En proceso de acreditación',
    mostrarSello: false,
  },

  cifras: [
    { numero: '0', etiqueta: '[Etiqueta]', sub: '[Subtítulo]' },
    { numero: '0', etiqueta: '[Etiqueta]', sub: '[Subtítulo]' },
    { numero: '0', etiqueta: '[Etiqueta]', sub: '[Subtítulo]' },
  ],

  decana: {
    nombre: '[Nombre]',
    cargo: 'Decano/a de la Escuela Profesional de [NOMBRE]',
    mensaje: '[Mensaje de bienvenida].',
    video: { youtubeId: '', start: 0 },
  },

  enlaces: {
    libroReclamaciones: 'https://',
    bolsaTrabajo: 'https://',
  },

  enlacesInstitucionales: [
    { label: 'Portal [SIGLAS]', url: 'https://' },
  ],
};
