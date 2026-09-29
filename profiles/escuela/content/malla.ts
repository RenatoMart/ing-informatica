import type { Edge } from 'reactflow';

// Datos del plan de estudios de la Escuela Profesional de Informática (UNT).
// El componente MallaFlow (sistema) consume estos datos vía @profile/content/malla.
//
// Fuente: "Currículo del Programa de Estudios de Informática" (R.C.U. No. 065-2018/UNT),
// sección 12 "Plan de Estudios" (códigos, créditos, horas y requisitos por curso).
// EG (Estudios Generales) → 'general', EE (Estudios Específicos) → 'especifico',
// ES (Estudios de Especialidad) → 'especialidad'. Suma total: 215 créditos, 10 ciclos.

// ── Tipos ──────────────────────────────────────────────────────────────────
export type AreaType = 'general' | 'especifico' | 'especialidad';

export interface CourseData {
  id: string;
  name: string;
  type: AreaType;
  credits: number;
  hoursT: number;
  hoursP: number;
  cycle: string;
  isElective: boolean;
  description: string;
}

// ── Datos del plan de estudios (Escuela Profesional de Informática) ─────────
export const CURRICULUM_DATA: CourseData[] = [
  // CICLO I — 22 créditos
  { id: '13024', name: 'Desarrollo Personal', type: 'general', credits: 3, hoursT: 2, hoursP: 2, cycle: 'Ciclo I', isElective: false, description: 'Herramientas de autoconocimiento, inteligencia emocional y proyecto de vida para la etapa universitaria.' },
  { id: '13029', name: 'Lectura Crítica y Redacción de Textos Académicos', type: 'general', credits: 3, hoursT: 2, hoursP: 2, cycle: 'Ciclo I', isElective: false, description: 'Comprensión lectora y producción de textos académicos con rigor gramatical y argumentativo.' },
  { id: '13027', name: 'Física General', type: 'general', credits: 4, hoursT: 2, hoursP: 4, cycle: 'Ciclo I', isElective: false, description: 'Fundamentos de mecánica clásica y magnitudes físicas aplicadas a problemas de ingeniería.' },
  { id: '13021', name: 'Algoritmos y Programación', type: 'especialidad', credits: 4, hoursT: 2, hoursP: 4, cycle: 'Ciclo I', isElective: false, description: 'Fundamentos de lógica de programación, algoritmos y su implementación en un lenguaje de programación.' },
  { id: '13023', name: 'Desarrollo del Pensamiento Lógico Matemático', type: 'general', credits: 3, hoursT: 1, hoursP: 4, cycle: 'Ciclo I', isElective: false, description: 'Razonamiento lógico-matemático aplicado a la resolución de problemas.' },
  { id: '13028', name: 'Introducción al Análisis Matemático', type: 'general', credits: 4, hoursT: 2, hoursP: 4, cycle: 'Ciclo I', isElective: false, description: 'Funciones, límites y bases del cálculo diferencial como preparación al análisis matemático.' },
  { id: '13031', name: 'Taller de Liderazgo y Trabajo en Equipo', type: 'general', credits: 1, hoursT: 0, hoursP: 2, cycle: 'Ciclo I', isElective: false, description: 'Habilidades blandas de liderazgo, comunicación y trabajo colaborativo en equipo.' },

  // CICLO II — 22 créditos
  { id: '13040', name: 'Ética, Convivencia Humana y Ciudadanía', type: 'general', credits: 3, hoursT: 2, hoursP: 2, cycle: 'Ciclo II', isElective: false, description: 'Principios éticos, convivencia democrática y ejercicio de la ciudadanía.' },
  { id: '13043', name: 'Sociedad, Cultura y Ecología', type: 'general', credits: 3, hoursT: 1, hoursP: 4, cycle: 'Ciclo II', isElective: false, description: 'Relación entre sociedad, cultura y medio ambiente desde una mirada crítica y sostenible.' },
  { id: '13036', name: 'Cultura Investigativa y Pensamiento Crítico', type: 'general', credits: 3, hoursT: 2, hoursP: 2, cycle: 'Ciclo II', isElective: false, description: 'Bases del método científico y del pensamiento crítico aplicados a la investigación.' },
  { id: '13039', name: 'Estructura de Datos', type: 'especialidad', credits: 4, hoursT: 2, hoursP: 4, cycle: 'Ciclo II', isElective: false, description: 'Estructuras de datos lineales y no lineales, y su implementación eficiente.' },
  { id: '13038', name: 'Estadística General', type: 'general', credits: 4, hoursT: 2, hoursP: 4, cycle: 'Ciclo II', isElective: false, description: 'Estadística descriptiva e inferencial aplicada al análisis de datos.' },
  { id: '13034', name: 'Análisis Matemático', type: 'general', credits: 4, hoursT: 2, hoursP: 4, cycle: 'Ciclo II', isElective: false, description: 'Cálculo diferencial e integral de una variable.' },
  { id: '13046', name: 'Taller de Manejo de TIC', type: 'general', credits: 1, hoursT: 0, hoursP: 2, cycle: 'Ciclo II', isElective: false, description: 'Uso de herramientas ofimáticas y tecnologías de información y comunicación para el trabajo académico.' },

  // CICLO III — 22 créditos
  { id: '13629', name: 'Geometría Analítica', type: 'especifico', credits: 4, hoursT: 2, hoursP: 4, cycle: 'Ciclo III', isElective: false, description: 'Geometría analítica en el plano y el espacio como herramienta para la computación gráfica.' },
  { id: '13630', name: 'Paradigmas de Lenguajes de Programación', type: 'especialidad', credits: 4, hoursT: 2, hoursP: 4, cycle: 'Ciclo III', isElective: false, description: 'Paradigmas de programación (estructurado, funcional, orientado a objetos) y su aplicación.' },
  { id: '13631', name: 'Estrategias Algorítmicas', type: 'especialidad', credits: 4, hoursT: 2, hoursP: 4, cycle: 'Ciclo III', isElective: false, description: 'Técnicas de diseño de algoritmos: divide y vencerás, voraz, programación dinámica y backtracking.' },
  { id: '13632', name: 'Matemática Discreta', type: 'especifico', credits: 4, hoursT: 2, hoursP: 4, cycle: 'Ciclo III', isElective: false, description: 'Lógica, teoría de conjuntos, combinatoria y teoría de grafos aplicadas a la computación.' },
  { id: '13633', name: 'Física para Ciencia de la Computación', type: 'especifico', credits: 3, hoursT: 2, hoursP: 2, cycle: 'Ciclo III', isElective: false, description: 'Fundamentos de física aplicados al diseño y funcionamiento de sistemas computacionales.' },
  { id: '13634', name: 'Análisis Numérico', type: 'especifico', credits: 3, hoursT: 2, hoursP: 2, cycle: 'Ciclo III', isElective: false, description: 'Métodos numéricos para la resolución aproximada de problemas matemáticos mediante computadora.' },

  // CICLO IV — 22 créditos
  { id: '13635', name: 'Computación Gráfica', type: 'especialidad', credits: 4, hoursT: 2, hoursP: 4, cycle: 'Ciclo IV', isElective: false, description: 'Fundamentos de gráficos por computadora: modelado, transformaciones y renderizado 2D/3D.' },
  { id: '13636', name: 'Organización de Archivos', type: 'especialidad', credits: 3, hoursT: 2, hoursP: 2, cycle: 'Ciclo IV', isElective: false, description: 'Métodos de organización, acceso y gestión de archivos como base de datos.' },
  { id: '13637', name: 'Algoritmos y Complejidad', type: 'especialidad', credits: 4, hoursT: 2, hoursP: 4, cycle: 'Ciclo IV', isElective: false, description: 'Análisis de complejidad computacional y clasificación de problemas algorítmicos.' },
  { id: '13638', name: 'Lenguajes Formales y Autómatas', type: 'especialidad', credits: 4, hoursT: 2, hoursP: 4, cycle: 'Ciclo IV', isElective: false, description: 'Gramáticas formales, autómatas finitos y su relación con los lenguajes de programación.' },
  { id: '13639', name: 'Electrónica para Computación', type: 'especialidad', credits: 4, hoursT: 2, hoursP: 4, cycle: 'Ciclo IV', isElective: false, description: 'Fundamentos de electrónica digital aplicados al diseño de sistemas computacionales.' },
  { id: '13640', name: 'Innovación y Emprendimiento', type: 'especialidad', credits: 3, hoursT: 2, hoursP: 2, cycle: 'Ciclo IV', isElective: false, description: 'Metodologías de innovación y emprendimiento tecnológico para la creación de soluciones informáticas.' },

  // CICLO V — 22 créditos
  { id: '13641', name: 'Base de Datos I', type: 'especialidad', credits: 4, hoursT: 2, hoursP: 4, cycle: 'Ciclo V', isElective: false, description: 'Modelado, diseño relacional y consultas SQL en bases de datos.' },
  { id: '13642', name: 'Ingeniería de Software I', type: 'especialidad', credits: 4, hoursT: 2, hoursP: 4, cycle: 'Ciclo V', isElective: false, description: 'Fundamentos del ciclo de vida del software: análisis, diseño y modelado de requerimientos.' },
  { id: '13643', name: 'Inteligencia Artificial I', type: 'especialidad', credits: 4, hoursT: 2, hoursP: 4, cycle: 'Ciclo V', isElective: false, description: 'Fundamentos de inteligencia artificial: búsqueda, representación del conocimiento y agentes.' },
  { id: '13644', name: 'Compiladores', type: 'especialidad', credits: 4, hoursT: 2, hoursP: 4, cycle: 'Ciclo V', isElective: false, description: 'Fases de construcción de un compilador: análisis léxico, sintáctico y semántico.' },
  { id: '13645', name: 'Técnicas Digitales para Computación', type: 'especialidad', credits: 4, hoursT: 2, hoursP: 4, cycle: 'Ciclo V', isElective: false, description: 'Diseño de circuitos digitales aplicados a la arquitectura de computadoras.' },
  { id: '13646', name: 'Metodología de la Investigación Científica', type: 'especialidad', credits: 2, hoursT: 2, hoursP: 0, cycle: 'Ciclo V', isElective: false, description: 'Proceso y diseño de investigación científica aplicados a proyectos en informática.' },

  // CICLO VI — 22 créditos
  { id: '14068', name: 'Computación Gráfica Avanzada', type: 'especialidad', credits: 4, hoursT: 2, hoursP: 4, cycle: 'Ciclo VI', isElective: false, description: 'Técnicas avanzadas de renderizado, iluminación y animación por computadora.' },
  { id: '14069', name: 'Base de Datos II', type: 'especialidad', credits: 4, hoursT: 2, hoursP: 4, cycle: 'Ciclo VI', isElective: false, description: 'Optimización, transacciones, concurrencia y administración avanzada de bases de datos.' },
  { id: '14070', name: 'Ingeniería de Software II', type: 'especialidad', credits: 4, hoursT: 2, hoursP: 4, cycle: 'Ciclo VI', isElective: false, description: 'Patrones de diseño, arquitectura de software y prácticas de construcción de sistemas.' },
  { id: '14071', name: 'Inteligencia Artificial II', type: 'especialidad', credits: 2, hoursT: 0, hoursP: 4, cycle: 'Ciclo VI', isElective: false, description: 'Aprendizaje automático y modelos de aprendizaje supervisado y no supervisado.' },
  { id: '14072', name: 'Comunicación de Datos', type: 'especialidad', credits: 4, hoursT: 2, hoursP: 4, cycle: 'Ciclo VI', isElective: false, description: 'Fundamentos de transmisión de datos y protocolos de comunicación.' },
  { id: '14073', name: 'Arquitectura y Organización de Computadoras', type: 'especialidad', credits: 4, hoursT: 2, hoursP: 4, cycle: 'Ciclo VI', isElective: false, description: 'Organización interna del hardware: procesador, memoria y buses del sistema.' },

  // CICLO VII — 22 créditos
  { id: '14074', name: 'Base de Datos Avanzada', type: 'especialidad', credits: 4, hoursT: 2, hoursP: 4, cycle: 'Ciclo VII', isElective: false, description: 'Bases de datos distribuidas, NoSQL y almacenamiento a gran escala.' },
  { id: '14075', name: 'Desarrollo de Software', type: 'especialidad', credits: 4, hoursT: 2, hoursP: 4, cycle: 'Ciclo VII', isElective: false, description: 'Construcción de aplicaciones de software siguiendo buenas prácticas de ingeniería.' },
  { id: '14076', name: 'Percepción y Visión por Computadora', type: 'especialidad', credits: 4, hoursT: 2, hoursP: 4, cycle: 'Ciclo VII', isElective: false, description: 'Procesamiento digital de imágenes y técnicas de visión artificial.' },
  { id: '14077', name: 'Redes de Computadoras I', type: 'especialidad', credits: 4, hoursT: 2, hoursP: 4, cycle: 'Ciclo VII', isElective: false, description: 'Modelo OSI/TCP-IP, direccionamiento y fundamentos de redes de computadoras.' },
  { id: '14078', name: 'Sistemas Operativos I', type: 'especialidad', credits: 4, hoursT: 2, hoursP: 4, cycle: 'Ciclo VII', isElective: false, description: 'Gestión de procesos, memoria y concurrencia en sistemas operativos.' },
  { id: '14079', name: 'Gestión de Proyectos Informáticos', type: 'especialidad', credits: 2, hoursT: 0, hoursP: 4, cycle: 'Ciclo VII', isElective: false, description: 'Planificación, ejecución y control de proyectos de tecnologías de la información.' },

  // CICLO VIII — 22 créditos
  { id: '14080', name: 'Robótica', type: 'especialidad', credits: 4, hoursT: 2, hoursP: 4, cycle: 'Ciclo VIII', isElective: false, description: 'Fundamentos de robótica: cinemática, sensórica y control de robots.' },
  { id: '14081', name: 'Redes de Computadoras II', type: 'especialidad', credits: 4, hoursT: 2, hoursP: 4, cycle: 'Ciclo VIII', isElective: false, description: 'Enrutamiento, conmutación y administración avanzada de redes.' },
  { id: '14082', name: 'Sistemas Operativos II', type: 'especialidad', credits: 4, hoursT: 2, hoursP: 4, cycle: 'Ciclo VIII', isElective: false, description: 'Sistemas de archivos, entrada/salida y administración avanzada de sistemas operativos.' },
  { id: '14083', name: 'Prácticas Pre-Profesionales', type: 'especialidad', credits: 10, hoursT: 1, hoursP: 18, cycle: 'Ciclo VIII', isElective: false, description: 'Experiencia práctica en organizaciones aplicando los conocimientos adquiridos hasta el ciclo VI.' },

  // CICLO IX — 22 créditos
  { id: '14084', name: 'Interacción Humano-Computador', type: 'especialidad', credits: 4, hoursT: 2, hoursP: 4, cycle: 'Ciclo IX', isElective: false, description: 'Principios de diseño de experiencia e interfaz de usuario centrados en la persona.' },
  { id: '14085', name: 'Tópicos en Base de Datos', type: 'especialidad', credits: 4, hoursT: 2, hoursP: 4, cycle: 'Ciclo IX', isElective: false, description: 'Temas avanzados y de actualidad en el diseño y administración de bases de datos.' },
  { id: 'INF34', name: 'Tópicos en Ingeniería de Software', type: 'especialidad', credits: 4, hoursT: 2, hoursP: 4, cycle: 'Ciclo IX', isElective: false, description: 'Temas avanzados y de actualidad en metodologías y prácticas de ingeniería de software.' },
  { id: '14087', name: 'Ingeniería de Software Avanzada', type: 'especialidad', credits: 4, hoursT: 2, hoursP: 4, cycle: 'Ciclo IX', isElective: false, description: 'Arquitecturas de software modernas y desarrollo de sistemas de gran escala.' },
  { id: '14088', name: 'Seguridad Informática', type: 'especialidad', credits: 4, hoursT: 2, hoursP: 4, cycle: 'Ciclo IX', isElective: false, description: 'Principios de ciberseguridad, criptografía y protección de sistemas de información.' },
  { id: '14089', name: 'Proyecto de Tesis', type: 'especialidad', credits: 2, hoursT: 1, hoursP: 2, cycle: 'Ciclo IX', isElective: false, description: 'Formulación del proyecto de investigación para la tesis de titulación.' },

  // CICLO X — 17 créditos
  { id: '14090', name: 'Tópicos en Tecnologías Inmersivas', type: 'especialidad', credits: 4, hoursT: 2, hoursP: 4, cycle: 'Ciclo X', isElective: false, description: 'Realidad virtual, realidad aumentada y otras tecnologías inmersivas emergentes.' },
  { id: '14091', name: 'Sistemas de Información', type: 'especialidad', credits: 3, hoursT: 2, hoursP: 2, cycle: 'Ciclo X', isElective: false, description: 'Análisis, diseño e implementación integral de sistemas de información organizacionales.' },
  { id: '14092', name: 'Ética para Profesionales en Informática', type: 'especialidad', credits: 3, hoursT: 2, hoursP: 2, cycle: 'Ciclo X', isElective: false, description: 'Deontología profesional, responsabilidad social y ética aplicada a la informática.' },
  { id: '14093', name: 'Proyecto de Competencia', type: 'especialidad', credits: 2, hoursT: 0, hoursP: 4, cycle: 'Ciclo X', isElective: false, description: 'Proyecto final en el área de competencia elegida por el estudiante.' },
  { id: '14094', name: 'Proyecto Integrador', type: 'especialidad', credits: 4, hoursT: 2, hoursP: 4, cycle: 'Ciclo X', isElective: false, description: 'Proyecto que integra los conocimientos de redes, gestión de proyectos, innovación y desarrollo de software.' },
  { id: 'INF43', name: 'Tesis', type: 'especialidad', credits: 1, hoursT: 0, hoursP: 2, cycle: 'Ciclo X', isElective: false, description: 'Desarrollo, sustentación y culminación de la tesis de titulación.' },
];

// Líneas de prerrequisitos, según la columna "Requisitos" del Plan de Estudios.
export const PREREQUISITES_EDGES: Edge[] = [
  { id: 'e-1', source: '13021', target: '13039', style: { stroke: '#38bdf8', strokeWidth: 2 } },
  { id: 'e-2', source: '13028', target: '13034', style: { stroke: '#f97316', strokeWidth: 2 } },
  { id: 'e-3', source: '13034', target: '13629', style: { stroke: '#f97316', strokeWidth: 2 } },
  { id: 'e-4', source: '13039', target: '13631', style: { stroke: '#38bdf8', strokeWidth: 2 } },
  { id: 'e-5', source: '13027', target: '13633', style: { stroke: '#f97316', strokeWidth: 2 } },
  { id: 'e-6', source: '13034', target: '13634', style: { stroke: '#f97316', strokeWidth: 2 } },
  { id: 'e-7', source: '13629', target: '13635', style: { stroke: '#38bdf8', strokeWidth: 2 } },
  { id: 'e-8', source: '13039', target: '13635', style: { stroke: '#38bdf8', strokeWidth: 2 } },
  { id: 'e-9', source: '13039', target: '13636', style: { stroke: '#38bdf8', strokeWidth: 2 } },
  { id: 'e-10', source: '13631', target: '13637', style: { stroke: '#38bdf8', strokeWidth: 2 } },
  { id: 'e-11', source: '13632', target: '13637', style: { stroke: '#38bdf8', strokeWidth: 2 } },
  { id: 'e-12', source: '13632', target: '13638', style: { stroke: '#38bdf8', strokeWidth: 2 } },
  { id: 'e-13', source: '13633', target: '13639', style: { stroke: '#38bdf8', strokeWidth: 2 } },
  { id: 'e-14', source: '13636', target: '13641', style: { stroke: '#38bdf8', strokeWidth: 2 } },
  { id: 'e-15', source: '13630', target: '13642', style: { stroke: '#38bdf8', strokeWidth: 2 } },
  { id: 'e-16', source: '13637', target: '13643', style: { stroke: '#38bdf8', strokeWidth: 2 } },
  { id: 'e-17', source: '13638', target: '13644', style: { stroke: '#38bdf8', strokeWidth: 2 } },
  { id: 'e-18', source: '13639', target: '13645', style: { stroke: '#38bdf8', strokeWidth: 2 } },
  { id: 'e-19', source: '13635', target: '14068', style: { stroke: '#38bdf8', strokeWidth: 2 } },
  { id: 'e-20', source: '13641', target: '14069', style: { stroke: '#38bdf8', strokeWidth: 2 } },
  { id: 'e-21', source: '13642', target: '14070', style: { stroke: '#38bdf8', strokeWidth: 2 } },
  { id: 'e-22', source: '13643', target: '14071', style: { stroke: '#38bdf8', strokeWidth: 2 } },
  { id: 'e-23', source: '13645', target: '14072', style: { stroke: '#38bdf8', strokeWidth: 2 } },
  { id: 'e-24', source: '13645', target: '14073', style: { stroke: '#38bdf8', strokeWidth: 2 } },
  { id: 'e-25', source: '14069', target: '14074', style: { stroke: '#38bdf8', strokeWidth: 2 } },
  { id: 'e-26', source: '14070', target: '14075', style: { stroke: '#38bdf8', strokeWidth: 2 } },
  { id: 'e-27', source: '14071', target: '14076', style: { stroke: '#38bdf8', strokeWidth: 2 } },
  { id: 'e-28', source: '14072', target: '14077', style: { stroke: '#38bdf8', strokeWidth: 2 } },
  { id: 'e-29', source: '14073', target: '14078', style: { stroke: '#38bdf8', strokeWidth: 2 } },
  { id: 'e-30', source: '14070', target: '14079', style: { stroke: '#38bdf8', strokeWidth: 2 } },
  { id: 'e-31', source: '14071', target: '14080', style: { stroke: '#38bdf8', strokeWidth: 2 } },
  { id: 'e-32', source: '14077', target: '14081', style: { stroke: '#38bdf8', strokeWidth: 2 } },
  { id: 'e-33', source: '14078', target: '14082', style: { stroke: '#38bdf8', strokeWidth: 2 } },
  { id: 'e-34', source: '14070', target: '14084', style: { stroke: '#38bdf8', strokeWidth: 2 } },
  { id: 'e-35', source: '14069', target: '14085', style: { stroke: '#38bdf8', strokeWidth: 2 } },
  { id: 'e-36', source: '14070', target: 'INF34', style: { stroke: '#38bdf8', strokeWidth: 2 } },
  { id: 'e-37', source: '14070', target: '14087', style: { stroke: '#38bdf8', strokeWidth: 2 } },
  { id: 'e-38', source: '14081', target: '14088', style: { stroke: '#38bdf8', strokeWidth: 2 } },
  { id: 'e-39', source: '14084', target: '14090', style: { stroke: '#38bdf8', strokeWidth: 2 } },
  { id: 'e-40', source: '14074', target: '14091', style: { stroke: '#38bdf8', strokeWidth: 2 } },
  { id: 'e-41', source: '14087', target: '14091', style: { stroke: '#38bdf8', strokeWidth: 2 } },
  { id: 'e-42', source: '13040', target: '14092', style: { stroke: '#38bdf8', strokeWidth: 2 } },
  { id: 'e-43', source: '14081', target: '14094', style: { stroke: '#38bdf8', strokeWidth: 2 } },
  { id: 'e-44', source: '14079', target: '14094', style: { stroke: '#38bdf8', strokeWidth: 2 } },
  { id: 'e-45', source: '13640', target: '14094', style: { stroke: '#38bdf8', strokeWidth: 2 } },
  { id: 'e-46', source: '14075', target: '14094', style: { stroke: '#38bdf8', strokeWidth: 2 } },
  { id: 'e-47', source: '14089', target: 'INF43', style: { stroke: '#38bdf8', strokeWidth: 2 } },
];

export const CYCLE_COLUMNS: Record<string, number> = {
  'Ciclo I': 0, 'Ciclo II': 320, 'Ciclo III': 640, 'Ciclo IV': 960, 'Ciclo V': 1280,
  'Ciclo VI': 1600, 'Ciclo VII': 1920, 'Ciclo VIII': 2240, 'Ciclo IX': 2560, 'Ciclo X': 2880,
};
