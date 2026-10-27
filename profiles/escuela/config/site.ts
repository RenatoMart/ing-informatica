import type { SiteConfig } from '@/profile-types';

/**
 * Identidad de la Escuela Profesional de Informática (UNT).
 *
 * Fuente: inf.unitru.edu.pe (portada, /nosotros, /acreditacion) y el "Currículo
 * del Programa de Estudios de Informática" (R.C.U. No. 065-2018/UNT). Algunos
 * campos (cifras de la franja del hero, mensaje del director) no tienen una
 * fuente pública exacta: usa datos verificables o dejarlos genéricos hasta
 * tener el dato real.
 */
export const site: SiteConfig = {
  programa: {
    nombre: 'Escuela Profesional de Informática',
    nombreCorto: 'Informática',
  },
  universidad: {
    nombre: 'Universidad Nacional de Trujillo',
    siglas: 'UNT',
    url: 'https://www.unitru.edu.pe',
    // Dominio para acotar el buscador del navbar (site:dominio). Déjalo vacío
    // para una búsqueda general en Google.
    dominio: 'inf.unitru.edu.pe',
  },
  facultad: 'Facultad de Ciencias Físicas y Matemáticas',

  // Denominación del tipo de unidad académica. Se usa en subtítulos genéricos.
  denominacion: 'Escuela Profesional',

  // Wordmark del navbar: se muestra en dos líneas (línea 1 en azul, línea 2 en dorado).
  wordmark: { linea1: 'Informática', linea2: 'UNT' },

  tagline: 'Desarrolla soluciones innovadoras que impacten al mundo.',

  hero: {
    eyebrow: 'Escuela Profesional de',
    titulo: { linea1: 'Ingeniería', linea2: 'Informática' },
    descripcion:
      'Prepárate para construir soluciones innovadoras en un sector en constante evolución. Sé parte del futuro digital y transforma el mundo con tu conocimiento.',
    ctas: {
      primary: { label: 'Ver Plan de Estudios', to: '/academico/malla-curricular' },
      secondary: { label: 'Perfiles académicos', to: '/academico/perfiles' },
    },
  },

  // Sello de acreditación (badge del hero). Fuente: inf.unitru.edu.pe/acreditacion
  // ("logró su primera acreditación internacional otorgada por ICACIT", ciclo de
  // evaluación 2020).
  acreditacion: {
    entidad: 'ICACIT',
    estado: 'acreditada',
    texto: 'Acreditada internacionalmente por ICACIT',
    mostrarSello: true,
  },

  // Cifras destacadas de la franja del hero. Se usan solo datos verificables
  // (fundación, créditos del plan de estudios, acreditación); no hay cifras
  // públicas de estudiantes/egresados para reemplazar el resto.
  cifras: [
    { numero: '30+', etiqueta: 'Años formando profesionales', sub: 'Programa fundado en 1995' },
    { numero: '215', etiqueta: 'Créditos académicos', sub: 'En 10 ciclos de formación' },
    { numero: 'ICACIT', etiqueta: 'Acreditación internacional', sub: 'Ciclo de evaluación 2020' },
  ],

  decana: {
    nombre: 'Dr. Mario Elder Chávez Bacilio',
    cargo: 'Decano de la Facultad de Ciencias Físicas y Matemáticas',
    mensaje:
      'La Escuela Profesional de Informática forma profesionales en Ciencia de la Computación con bases sólidas, siguiendo el estándar internacional de la ACM, para liderar el desarrollo de la disciplina en el país.',
    // ID del video de YouTube para el mensaje de bienvenida. Déjalo vacío hasta
    // tener el video de tu programa; al ponerlo, el reproductor aparece solo.
    video: { youtubeId: '', start: 0 },
  },

  enlaces: {
    libroReclamaciones: 'https://reclamos.servicios.gob.pe/?institution_id=247',
    bolsaTrabajo: '#',
  },

  // Fuente: portales institucionales enlazados desde inf.unitru.edu.pe.
  enlacesInstitucionales: [
    { label: 'Sistema de Gestión Académica (SGA)', url: 'http://aplicaciones.unitru.edu.pe/' },
    { label: 'Sistema Único de Virtualización (SUV)', url: 'http://suv2.unitru.edu.pe' },
    { label: 'Aula Virtual', url: 'https://aulavirtual2.unitru.edu.pe' },
  ],
};
