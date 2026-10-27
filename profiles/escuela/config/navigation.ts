import type { NavSection, NavGroup } from '@/profile-types';

/**
 * Datos de navegación de la escuela (Configuración del perfil).
 * Alimenta Navbar (menú + desplegables agrupados), SectionTabs y Breadcrumbs.
 * Los helpers de recorrido están en `src/navigation.ts` (sistema); importar desde ahí.
 *
 * Patrón "navbar granular → página agrupada": un `item` = UNA página (= UNA pestaña).
 * Si trae `navAs`, el Navbar lo muestra desglosado en etiquetas finas con #ancla,
 * pero todas llevan a la misma página.
 *
 * "Admisión" NO está en el menú: vive en el panel lateral (FloatingAdmissions),
 * por eso se exporta aparte como ADMISION_GROUPS.
 *
 * Nota: las rutas (`path`) deben coincidir con las definidas en el router del
 * sistema (`src/router`). Cambiar etiquetas es seguro; cambiar rutas requiere
 * actualizar también el router.
 */
export const NAV_LINKS: NavSection[] = [
  { name: 'Inicio', path: '/' },
  {
    name: 'Nosotros',
    path: '/nosotros',
    groups: [
      {
        label: 'Identidad',
        items: [
          { name: 'Historia', path: '/nosotros/historia' },
          {
            name: 'Misión y Visión',
            path: '/nosotros/mision-vision',
            navAs: [
              { name: 'Misión', path: '/nosotros/mision-vision#mision' },
              { name: 'Visión', path: '/nosotros/mision-vision#vision' },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Organización',
    path: '/organizacion',
    groups: [
      {
        label: 'Autoridades',
        items: [
          {
            name: 'Dirección',
            path: '/organizacion/direccion',
            navAs: [
              { name: 'Director de escuela', path: '/organizacion/direccion#escuela' },
              { name: 'Director de departamento', path: '/organizacion/direccion#departamento' },
            ],
          },
        ],
      },
      {
        label: 'Órganos de Gobierno',
        items: [
          {
            name: 'Órganos de Gobierno',
            path: '/organizacion/organos-gobierno',
            navAs: [
              { name: 'Decano', path: '/organizacion/organos-gobierno#decano' },
              { name: 'Centro Federado', path: '/organizacion/organos-gobierno#centro-federado' },
            ],
          },
        ],
      },
      {
        label: 'Personal',
        items: [
          { name: 'Docentes', path: '/organizacion/docentes' },
          { name: 'Administrativos', path: '/organizacion/administrativos' },
        ],
      },
      {
        label: 'Comités',
        items: [
          {
            name: 'Comités',
            path: '/organizacion/comites',
            navAs: [
              { name: 'Comité de Calidad', path: '/organizacion/comites#calidad' },
              { name: 'Comité Técnico de Currículo', path: '/organizacion/comites#curriculo' },
              { name: 'Comité de Tutoría y Consejería', path: '/organizacion/comites#tutoria' },
              { name: 'Comité de Seguimiento al Egresado', path: '/organizacion/comites#egresado' },
              { name: 'Comité de Investigación', path: '/organizacion/comites#investigacion' },
              { name: 'Comité de Responsabilidad Social', path: '/organizacion/comites#responsabilidad' },
            ],
          },
        ],
      },
      {
        label: 'Estructura',
        items: [
          { name: 'Mapa de procesos', path: '/organizacion/estructura' },
        ],
      },
    ],
  },
  {
    name: 'Académico',
    path: '/academico',
    groups: [
      // "Formación" (Objetivos + Perfiles) movida desde Nosotros y puesta ARRIBA:
      // sigue la cadena de acreditación objetivos → perfil → malla.
      {
        label: 'Formación',
        items: [
          {
            name: 'Objetivos',
            path: '/academico/objetivos',
            navAs: [
              { name: 'Objetivos académicos', path: '/academico/objetivos#academicos' },
              { name: 'Objetivos educacionales', path: '/academico/objetivos#educativos' },
            ],
          },
          {
            name: 'Perfiles',
            path: '/academico/perfiles',
            navAs: [
              { name: 'Perfil de ingreso', path: '/academico/perfiles#ingreso' },
              { name: 'Perfil de egreso', path: '/academico/perfiles#egreso' },
            ],
          },
        ],
      },
      {
        label: 'Plan de estudios',
        items: [
          { name: 'Malla curricular', path: '/academico/malla-curricular' },
          { name: 'Titulación', path: '/academico/titulacion' },
        ],
      },
      {
        label: 'Recursos',
        items: [
          { name: 'Laboratorios', path: '/academico/laboratorios' },
        ],
      },
      {
        label: 'Vinculación',
        items: [
          { name: 'Convenios', path: '/academico/convenios' },
          { name: 'Movilidad', path: '/academico/movilidad' },
        ],
      },
    ],
  },
  {
    name: 'Investigación',
    path: '/investigacion',
    groups: [
      {
        label: 'Producción',
        items: [
          { name: 'Líneas de investigación', path: '/investigacion/lineas' },
          { name: 'Publicaciones', path: '/investigacion/publicaciones' },
          { name: 'Revistas', path: '/investigacion/revistas' },
        ],
      },
      {
        label: 'Proyectos',
        items: [
          {
            name: 'Proyectos',
            path: '/investigacion/proyectos',
            navAs: [
              { name: 'Proyectos de investigación', path: '/investigacion/proyectos#investigacion' },
              { name: 'Proyectos y tesis', path: '/investigacion/proyectos#tesis' },
            ],
          },
        ],
      },
    ],
  },
  { name: 'Reportes', path: '/reportes' },
  { name: 'Contacto', path: '/contacto' },
];

/**
 * Contenido de "Admisión" para el panel lateral (FloatingAdmissions).
 * Mismo modelo de grupos. Las estadísticas son enlaces externos (↗).
 */
export const ADMISION_GROUPS: NavGroup[] = [
  {
    label: 'Postulantes',
    items: [
      { name: 'Guía del postulante', path: '/admision/guia' },
    ],
  },
  {
    label: 'Estadísticas (últimos 5 años)',
    items: [
      { name: 'Ingresantes', path: '#', external: true },
      { name: 'Matriculados', path: '#', external: true },
      { name: 'Graduados', path: '#', external: true },
      { name: 'Titulados', path: '#', external: true },
    ],
  },
  {
    label: 'Documentos',
    items: [
      { name: 'Resoluciones', path: '/admision/resoluciones' },
      {
        name: 'Política de Gestión de Calidad',
        path: 'https://drive.google.com/file/d/1frtwwoFOHq9FcjUr88d5axbL-abLF2Ik/view?usp=drive_link',
        external: true,
      },
      { name: 'Gestión de la Formación en Pregrado', path: '/admision/gestion-formacion-pregrado' },
    ],
  },
];
