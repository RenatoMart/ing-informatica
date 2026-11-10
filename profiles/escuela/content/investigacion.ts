// Fuente: Anexo A del "Currículo del Programa de Estudios de Informática"
// (R.C.U. No. 065-2018/UNT) — áreas de investigación/competencia en las que se
// agrupan los cursos de especialidad. No se ubicó un responsable nombrado por
// área; reemplaza "Docentes del área" por el nombre real cuando lo tengas.
export const lineasInvestigacion = [
  {
    nombre: "Algoritmos y Complejidad",
    descripcion: "Diseño y análisis de algoritmos, estrategias algorítmicas, lenguajes formales y autómatas, y compiladores.",
    responsable: "Docentes del área"
  },
  {
    nombre: "Ingeniería de Software",
    descripcion: "Métodos, procesos y herramientas para el desarrollo, arquitectura y calidad de sistemas de software.",
    responsable: "Docentes del área"
  },
  {
    nombre: "Administración de la Información",
    descripcion: "Diseño, optimización y administración de bases de datos, incluyendo bases de datos avanzadas y distribuidas.",
    responsable: "Docentes del área"
  },
  {
    nombre: "Sistemas Inteligentes",
    descripcion: "Inteligencia artificial, aprendizaje automático, percepción y visión por computadora, y robótica.",
    responsable: "Docentes del área"
  },
  {
    nombre: "Arquitectura de Computadoras, Redes y Comunicaciones",
    descripcion: "Organización de computadoras, redes de datos, sistemas operativos y seguridad informática.",
    responsable: "Docentes del área"
  },
  {
    nombre: "Gráficos, Visualización e Interacción Humano-Computador",
    descripcion: "Computación gráfica, interacción humano-computador y tecnologías inmersivas.",
    responsable: "Docentes del área"
  }
];

export const proyectos = [
  {
    titulo: "Título del proyecto de investigación 1",
    estado: "En ejecución",
    año: "2023-2024",
    descripcion: "Descripción breve del primer proyecto de investigación del programa.",
    investigadores: ["Nombre del Investigador 1", "Nombre del Investigador 2"]
  },
  {
    titulo: "Título del proyecto de investigación 2",
    estado: "Finalizado",
    año: "2022-2023",
    descripcion: "Descripción breve del segundo proyecto de investigación del programa.",
    investigadores: ["Nombre del Investigador 1", "Nombre del Investigador 2"]
  }
];

export const publicaciones = [
  {
    titulo: "Título de la publicación 1",
    autores: "Apellido, N., & Apellido, N.",
    año: 2023,
    revista: "Nombre de la revista",
    url: "#"
  }
];

export const convenios = [
  {
    institucion: "Nombre de la institución aliada",
    tipo: "Interinstitucional",
    descripcion: "Descripción breve del convenio: con quién y para qué.",
    vigencia: "2022 - 2027"
  }
];

// Revistas. Fuente: revistas.unitru.edu.pe/index.php/ctech (consultado en 2026).
const CTECH = "https://revistas.unitru.edu.pe/index.php/ctech";
export const revistas = [
  {
    nombre: "Científica TechNoLogica",
    editorial: "Universidad Nacional de Trujillo · Filial Valle Jequetepeque",
    descripcion:
      "Difunde investigación científica, tecnológica y profesional en informática, ingeniería de sistemas y áreas afines: ciencia de datos, inteligencia artificial, ciberseguridad, ingeniería de software, IoT, computación en la nube y criptografía. Promueve la investigación, la innovación y el intercambio de conocimiento entre estudiantes, docentes y profesionales.",
    numeroActual: {
      titulo: "Vol. 1, N.º 3 (2026) · julio - septiembre",
      tema: "Fundamentos matemáticos y teóricos de las bases de datos: álgebra y cálculo relacional, normalización y forma normal de Boyce-Codd (BCNF).",
      articulos: [
        "Fundamentos matemáticos de las consultas relacionales aplicados a un sistema de gestión de bolsa de trabajo",
        "Extorsión e inseguridad ciudadana percibida en Chepén: un análisis correlacional con datos simulados",
        "Diseño e implementación de un sistema de gestión de cine con MySQL y VBA Excel",
        "Formas normales en bases de datos relacionales: de la Primera a la Quinta Forma Normal y BCNF",
        "UNITRABAJO: una base de datos para la gestión de ofertas laborales estudiantiles en la Facultad de Ingeniería"
      ]
    },
    enlaces: [
      { etiqueta: "Sitio de la revista", url: CTECH },
      { etiqueta: "Número actual", url: `${CTECH}/issue/current` },
      { etiqueta: "Archivo", url: `${CTECH}/issue/archive` },
      { etiqueta: "Envíos", url: `${CTECH}/about/submissions` }
    ],
    correo: "technologica@unitru.edu.pe",
    direccion: "Calle Ayacucho 282, Jequetepeque, Pacasmayo, La Libertad, Perú"
  }
];

// Convenios. Fuente: ORNI-UNT (orni.unitru.edu.pe/convenios). La ORNI publica los convenios
// de la universidad por país (internacionales) y por tipo de institución (nacionales); el
// detalle de cada convenio está en esas páginas, por eso aquí se enlazan en vez de copiarse.
const ORNI = "https://orni.unitru.edu.pe";
export const conveniosOrni = {
  portal: `${ORNI}/convenios/`,
  comoSuscribir: `${ORNI}/como-suscribir-un-convenio-con-la-unt/`,
  becasYRedes: `${ORNI}/convenios/becas-y-redes/`,
  internacionales: [
    { pais: "Estados Unidos", slug: "estados-unidos" },
    { pais: "México", slug: "mexico" },
    { pais: "Brasil", slug: "brasil" },
    { pais: "Uruguay", slug: "urugay" },
    { pais: "Paraguay", slug: "paraguay" },
    { pais: "Argentina", slug: "argentina" },
    { pais: "Colombia", slug: "colombia" },
    { pais: "Ecuador", slug: "ecuador" },
    { pais: "Cuba", slug: "cuba" },
    { pais: "Chile", slug: "chile" },
    { pais: "Costa Rica", slug: "costa-rica" },
    { pais: "Puerto Rico", slug: "puerto-rico" },
    { pais: "España", slug: "espana" },
    { pais: "Nigeria", slug: "nigeria" },
    { pais: "Italia", slug: "italia" },
    { pais: "República Checa", slug: "republica-checa" },
    { pais: "Alemania", slug: "alemania" },
    { pais: "Francia", slug: "francia" },
    { pais: "Rusia", slug: "rusia" },
    { pais: "Israel", slug: "israel" },
    { pais: "Bolivia", slug: "bolivia" },
    { pais: "Austria", slug: "austria" }
  ].map((c) => ({ pais: c.pais, url: `${ORNI}/${c.slug}/` })),
  nacionales: [
    { nombre: "Universidades", descripcion: "Convenios con universidades del país, organizados por región.", url: `${ORNI}/universidades/` },
    { nombre: "Gobiernos regionales", descripcion: "Alianzas con gobiernos regionales.", url: `${ORNI}/gobiernos-regionales-y-locales/` },
    { nombre: "Gobiernos locales", descripcion: "Alianzas con municipalidades.", url: `${ORNI}/gobiernos-locales/` },
    { nombre: "Instituciones públicas", descripcion: "Convenios con instituciones y redes nacionales.", url: `${ORNI}/instituciones-y-redes-nacionales/` },
    { nombre: "Instituciones privadas", descripcion: "Convenios con empresas e instituciones privadas.", url: `${ORNI}/empresas/` },
    { nombre: "Organizaciones sin fines de lucro", descripcion: "Convenios con organizaciones no gubernamentales.", url: `${ORNI}/organizaciones-sin-fines-de-lucro/` }
  ]
};
