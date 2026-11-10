// Fuente: misión y visión, "Currículo del Programa de Estudios de Informática"
// (R.C.U. No. 065-2018/UNT), sección 1.2.1.2; valores, sección 1.2.2.2 del mismo
// documento; reseña histórica, página "Nosotros" de inf.unitru.edu.pe.

export let mision = "Formación académica de recursos humanos en computación a nivel de pregrado, con el objetivo de generar y difundir el conocimiento comprometido con los desafíos nacionales e internacionales, que llevan al avance científico y tecnológico de la computación.";

export let vision = "La Escuela Profesional de Informática (EPI) será líder nacional en la enseñanza e investigación, preparando ciudadanos que puedan contribuir con la creatividad, la humanidad y la innovación para una sociedad global justa y con éxito.";

// Misión y visión de la UNT. Fuente: Currículo (R.C.U. No. 065-2018/UNT), sección 1.2.1.1.
export let misionUnt = "Somos la primera universidad republicana del Perú, formamos profesionales y académicos competitivos, con calidad, críticos, éticos y socialmente responsables; creamos valor generando y transfiriendo conocimiento científico, tecnológico, humanístico e innovador, para el desarrollo sostenible de la Región La Libertad y del país.";

export let visionUnt = "Al 2024, ubicada entre las cinco primeras universidades del Perú, reconocida por su calidad, por su vocación democrática, por la formación integral del talento humano, la investigación científica, tecnológica, humanística y la innovación; con responsabilidad social satisface a los grupos de interés y contribuye al desarrollo sostenible de la Región La Libertad y el país.";

// Objetivos educacionales del Programa de Estudios (egresados que, pocos años después de
// egresar, ...). Fuente: Currículo (R.C.U. No. 065-2018/UNT), sección 8.
export const objetivosEducacionales = [
  { codigo: "OE1", descripcion: "Hayan participado en proyectos multidisciplinarios para resolver problemas computacionales en diferentes ámbitos de la sociedad demostrando su competencia profesional e integridad." },
  { codigo: "OE2", descripcion: "Haya mejorado sus competencias profesionales o de investigación a lo largo de su vida." },
  { codigo: "OE3", descripcion: "Hayan sido un agente de cambio haciendo uso de la computación, con responsabilidad social y ética para lograr el desarrollo sostenible de la región y del país." }
];

// Objetivos educacionales de la UNT. Fuente: Currículo, sección 4.
export const objetivosEducacionalesUnt = [
  { codigo: "4.1", descripcion: "Garantizar la calidad del proceso de formación integral de los estudiantes mediante el logro de las competencias previstas en el perfil de egreso y la satisfacción de los grupos de interés." },
  { codigo: "4.2", descripcion: "Implementar estrategias de mejora curricular como resultado de la evaluación de la gestión académica al programa de formación, dando cuenta del cumplimiento de la misión y objetivos de calidad, en el marco del modelo educativo institucional." },
  { codigo: "4.3", descripcion: "Contribuir socialmente al desarrollo y competitividad del país, desde la acción formadora de alta calidad." }
];

// Objetivos académicos: el Currículo no los nombra así; se presentan las competencias del
// Programa de Estudios (sección 9), que son lo que el programa se propone lograr en el estudiante.
export const objetivosAcademicos = {
  generica: "Demuestra conocimientos teóricos-prácticos del campo de la informática que lo habilitan para desenvolverse como profesionales e investigadores en ciencia computacional, competentes e íntegros con responsabilidad social, capaces de resolver problemas computacionales en diferentes ámbitos de la sociedad, con calidad y rigor científico para lograr el desarrollo sostenible de la región y del país.",
  especificas: [
    "Participa en proyectos multidisciplinarios para resolver problemas computacionales en diferentes ámbitos de la sociedad demostrando su competencia profesional e integridad.",
    "Aplica con ética profesional conocimientos computacionales teórico-práctico-aplicación involucrándose como actor principal del desarrollo de la sociedad."
  ]
};

export const valores = [
  {
    nombre: "Verdad",
    descripcion: "Búsqueda y comunicación honesta del conocimiento en la formación y la práctica profesional."
  },
  {
    nombre: "Honestidad",
    descripcion: "Coherencia entre lo que se piensa, se dice y se hace en la vida académica y profesional."
  },
  {
    nombre: "Honradez",
    descripcion: "Rectitud e integridad en el actuar personal, académico y de investigación."
  },
  {
    nombre: "Libertad",
    descripcion: "Autonomía de pensamiento y de acción, ejercida con responsabilidad."
  },
  {
    nombre: "Solidaridad",
    descripcion: "Compromiso con el bienestar de la comunidad universitaria y de la sociedad."
  },
  {
    nombre: "Responsabilidad",
    descripcion: "Cumplimiento consciente de los deberes académicos, profesionales y sociales."
  }
];

export const historia = {
  fundacion: 1995,
  resena: "El programa de estudios de la Escuela Profesional de Informática (EPI) de la Universidad Nacional de Trujillo hace ciencia de la computación desde 1995, impulsado por docentes del Departamento de Matemáticas. Sus primeras clases se dictaron en el aula F9 de la Escuela de Física, con un laboratorio de 8 computadoras Olivetti.",
  hitos: [
    {
      año: 1995,
      descripcion: "Fundación del programa de estudios el 12 de septiembre, impulsado por docentes del Departamento de Matemáticas. Primeras clases en el aula F9 de la Escuela de Física, con un laboratorio de 8 computadoras Olivetti. Prof. Oswaldo Sánchez Rosales, primer coordinador."
    },
    {
      año: 1996,
      descripcion: "El Dr. Ausberto Castro asume como primer Director de Escuela. El 25 de abril, el Consejo Universitario aprueba ajustes al currículo del programa."
    },
    {
      año: 1997,
      descripcion: "Aprobación oficial del currículo mediante Resolución Rectoral No. 1037-97/UNT, del 29 de mayo."
    },
    {
      año: 2018,
      descripcion: "Aprobación del currículo vigente del programa de estudios de Informática mediante Resolución de Consejo Universitario No. 065-2018/UNT, alineado al estándar internacional de la ACM (Association for Computing Machinery)."
    }
  ]
};

/** Lo llama el cargador remoto (src/data) para actualizar estos textos con los del panel. */
export function __aplicar(d: Partial<{ mision: string; vision: string; misionUnt: string; visionUnt: string }>): void {
  if (d.mision !== undefined) mision = d.mision;
  if (d.vision !== undefined) vision = d.vision;
  if (d.misionUnt !== undefined) misionUnt = d.misionUnt;
  if (d.visionUnt !== undefined) visionUnt = d.visionUnt;
}
