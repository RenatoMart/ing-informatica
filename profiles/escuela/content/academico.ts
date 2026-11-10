// Fuente: "Currículo del Programa de Estudios de Informática" (R.C.U. No. 065-2018/UNT),
// secciones 10 (Perfil del Programa de Estudios) y 14.3 (Procesos de graduación y
// titulación). El perfil de ingreso y de egreso (con sus capacidades terminales) se
// reconfirmó, textualmente igual, en la ficha de la carrera (código 27) publicada hoy
// en admisionunt.info/carreraDetalle/27, que además incluye "Perspectivas Ocupacionales"
// (salidas laborales) sin un lugar en el sitio todavía.
//
// Ojo: esa misma ficha dice "Grado Académico: Bachiller en Ingeniería Informática",
// mientras que el currículo 2018 y la propia inf.unitru.edu.pe dicen "Bachiller en
// Ciencias de la Computación". Se mantiene esta última (coincide en 2 de 3 fuentes y
// es la que fija el currículo vigente); confírmalo con la escuela si puedes.

export let gradoAcademico = "Bachiller en Ciencias de la Computación";
export let tituloProfesional = "Ingeniero Informático";

export const perfilIngresante = [
  { area: "Formación General", descripcion: "Posee información básica en las ciencias naturales, sociales y formales, así como de la cultura humanística en perspectiva histórica a nivel del Perú y del mundo." },
  { area: "Comunicación", descripcion: "Posee habilidades de registro, uso y reelaboración de la información y el uso correcto del lenguaje, con el propósito de expresar y comprender sus ideas y las que recibe de su entorno." },
  { area: "Lógico-Matemática", descripcion: "Reconoce y aplica nociones fundamentales de lógica matemática para resolver problemas en el contexto computacional y ciencias afines." },
  { area: "Idioma Inglés", descripcion: "Maneja el idioma inglés a nivel básico, que le permita asimilar los conceptos informáticos que fortalecerán su formación." },
  { area: "Habilidades Interpersonales", descripcion: "Denota en sus relaciones intra e interpersonales autodominio y compañerismo para integrarse y desempeñarse en equipo, así como interés permanente en los estudios." },
  { area: "Ética", descripcion: "Denota conducta ética en lo personal y social." },
  { area: "Pensamiento Abstracto", descripcion: "Denota capacidad de abstracción para la elaboración de modelos de la realidad y para la solución de problemas." }
];

export const perfilEgresado = [
  {
    area: "Unidad de Competencia 1",
    descripcion: "Participa en proyectos multidisciplinarios para resolver problemas computacionales en diferentes ámbitos de la sociedad, demostrando su competencia profesional e integridad. Capacidades terminales: maneja e integra la abstracción, el pensamiento sistémico, la experimentación y el trabajo en equipo; desarrolla proyectos con iniciativa y espíritu emprendedor; aprende de forma autónoma a lo largo de su vida; se desenvuelve y comunica eficazmente en equipo para alcanzar una meta común; comprende su responsabilidad profesional, ética, legal, de seguridad y social; realiza investigaciones con rigor científico; y contribuye con los resultados de la investigación a resolver problemas de la comunidad nacional e internacional."
  },
  {
    area: "Unidad de Competencia 2",
    descripcion: "Aplica con ética profesional conocimientos computacionales teórico-práctico-aplicación, involucrándose como actor principal del desarrollo de la sociedad. Capacidades terminales: aplica fundamentos matemáticos, principios algorítmicos y teoría de ciencia de la computación en el modelamiento y diseño de sistemas basados en computadora; aplica principios de diseño y desarrollo computacional en la construcción de sistemas de software y nuevas arquitecturas de cómputo; realiza proyectos computacionales multidisciplinarios; desarrolla métodos y modelos eficientes para resolver problemas computacionales; diseña algoritmos eficientes para sistemas gestores de bases de datos, redes, inteligencia artificial y procesamiento gráfico; proyecta y construye software base y de aplicación de alta calidad y bajo costo; y reconoce y valora las relaciones entre Informática y Sociedad."
  }
];

// Salidas laborales / campo ocupacional del egresado. Fuente: admisionunt.info
// (ficha de la carrera, código 27). No hay ninguna página del sitio que muestre
// esta lista todavía; agrégala si creas una sección de "Campo Laboral".
export const perspectivasOcupacionales = [
  "Desarrollo de software inteligente y de aplicaciones móviles",
  "Entrenamiento de modelos computacionales de procesamiento gráfico",
  "Análisis y diseño de software empresarial",
  "Gestión de proyectos informáticos",
  "Asesoría y/o administración de empresas dedicadas a la Informática",
  "Aplicación de modelos matemáticos, heurísticos, estadísticos e informáticos",
  "Participación en centros de investigación"
];

export const titulacion = [
  {
    modalidad: "Tesis de Investigación",
    descripcion: "Elaboración y sustentación de una tesis de investigación inédita, conforme a la Directiva y el reglamento del Comité de Dirección de la EPI, aprobados por el Consejo de Facultad.",
    requisitos: [
      "Tener el grado académico de Bachiller en Ciencias de la Computación",
      "Elaborar una tesis de investigación inédita",
      "Sustentar la tesis ante el jurado designado"
    ]
  },
  {
    modalidad: "Trabajo de Suficiencia Profesional",
    descripcion: "Elaboración y sustentación de un trabajo de suficiencia profesional inédito, conforme a la Directiva y el reglamento del Comité de Dirección de la EPI, aprobados por el Consejo de Facultad.",
    requisitos: [
      "Tener el grado académico de Bachiller en Ciencias de la Computación",
      "Elaborar un trabajo de suficiencia profesional inédito",
      "Sustentar el trabajo ante el jurado designado"
    ]
  }
];

export const tramites = [
  {
    id: "bachiller",
    titulo: "Grado de Bachiller en Ciencias de la Computación",
    descripcion: "Requisitos para ser declarado expedito para optar el Grado de Bachiller, según el Art. 45.1 de la Ley Universitaria N° 30220.",
    requisitos: [
      "Aprobar un total de 213 créditos entre estudios generales, específicos y de especialidad del currículo de la EPI",
      "Aprobar un trabajo de investigación, según la Directiva del Comité de Dirección de Escuela aprobada por el Consejo de Facultad",
      "Acreditar, con certificado de aprobación, el conocimiento del idioma inglés en los niveles básico e intermedio"
    ],
    pdfUrl: `${import.meta.env.BASE_URL}Requisitos_Bachiller.pdf`
  },
  {
    id: "titulo",
    titulo: "Título Profesional de Ingeniero Informático",
    descripcion: "Requisitos para ser declarado expedito para optar el Título Profesional, según el Art. 45.2 de la Ley Universitaria N° 30220.",
    requisitos: [
      "Tener el grado académico de Bachiller en Ciencias de la Computación",
      "Aprobar una tesis de investigación inédita o un trabajo de suficiencia profesional inédito",
      "Cumplir la Directiva y el reglamento de elaboración y sustentación aprobados por el Consejo de Facultad"
    ],
    pdfUrl: `${import.meta.env.BASE_URL}Requisitos_Titulo.pdf`
  }
];

// Oportunidades de movilidad e intercambio (estudiantil y docente).
// Misma forma que `convenios`: se muestran como tarjetas.
export const movilidad = [
  {
    institucion: "Instituto de Ciencias Matemáticas y de Computación (ICMC), Universidad de São Paulo, Brasil",
    tipo: "Movilidad estudiantil",
    descripcion: "Convenio para el intercambio de estudiantes del 4.° año de la EPI, aprobado por Resolución de Consejo Universitario N° 009-2014/UNT. Desde 2015, los tres primeros estudiantes de cada promoción son beneficiarios de esta movilidad en São Paulo, Brasil.",
    modalidad: "Anual",
  },
  {
    institucion: "CONCYTEC",
    tipo: "Movilidad docente",
    descripcion: "La EPI no cuenta actualmente con convenios propios de movilidad docente; sin embargo, el CONCYTEC fomenta la movilidad de docentes con apoyo financiero.",
    modalidad: "Apoyo financiero externo",
  },
];

/** Lo llama el cargador remoto (src/data) para actualizar estos textos con los del panel. */
export function __aplicar(d: Partial<{ gradoAcademico: string; tituloProfesional: string }>): void {
  if (d.gradoAcademico !== undefined) gradoAcademico = d.gradoAcademico;
  if (d.tituloProfesional !== undefined) tituloProfesional = d.tituloProfesional;
}
