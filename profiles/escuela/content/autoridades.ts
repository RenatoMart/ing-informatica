// Fuente: dato confirmado directamente por el usuario (2026). El "Currículo del
// Programa de Estudios de Informática" (R.C.U. No. 065-2018/UNT) listaba a otra
// persona como Director de Escuela; ese documento quedó desactualizado en este cargo.
// No se confirmó un correo directo del Mg. Mendoza: se usa el correo general de la
// escuela como marcador de posición; reemplázalo por el suyo cuando lo tengas.
export const director = {
  nombre: "Mg. Edwin Ricardo Mendoza Torres",
  cargo: "Director de la Escuela Profesional de Informática",
  correo: "informatica@unitru.edu.pe",
  bio: "Magíster, docente del Departamento Académico de Informática de la Universidad Nacional de Trujillo.",
  foto: null // Reemplaza por la ruta de la foto o deja null para la silueta
};

// Director del Departamento Académico de Informática (distinto de la Dirección de
// Escuela). Se muestra en /organizacion/direccion#departamento, vía
// src/pages/autoridades/DireccionDepartamento.tsx.
export const directorDepartamento = {
  nombre: "Dr. Jorge Luis Gutiérrez Gutiérrez",
  cargo: "Director del Departamento Académico de Informática",
  correo: "informatica@unitru.edu.pe",
  bio: "Doctor, docente del Departamento Académico de Informática de la Universidad Nacional de Trujillo.",
  foto: null
};

export const coordinadores = [
  {
    nombre: "Nombre del Coordinador(a)",
    cargo: "Coordinador(a) Académico",
    correo: "coordinacion.academica@universidad.edu.pe"
  },
  {
    nombre: "Nombre del Coordinador(a)",
    cargo: "Coordinador(a) de Investigación",
    correo: "coordinacion.investigacion@universidad.edu.pe"
  },
  {
    nombre: "Nombre del Coordinador(a)",
    cargo: "Coordinador(a) de Prácticas Preprofesionales",
    correo: "coordinacion.practicas@universidad.edu.pe"
  }
];

// Estructura según el Estatuto UNT vigente (2021, pág. 18): una Facultad se
// compone de Escuela Profesional, Departamentos Académicos, Unidad de Segunda
// Especialidad, Unidad de Investigación y Unidad de Posgrado.
export const organigrama = {
  nombre: "Facultad",
  cargo: "Decano(a)",
  hijos: [
    { nombre: "Escuela Profesional", cargo: "Director(a) de Escuela" },
    { nombre: "Departamentos Académicos", cargo: "Jefe(s) de Departamento" },
    { nombre: "Unidad de Segunda Especialidad", cargo: "" },
    { nombre: "Unidad de Investigación", cargo: "" },
    { nombre: "Unidad de Posgrado", cargo: "" }
  ]
};

// Decano de la Facultad de Ciencias Físicas y Matemáticas (dato proporcionado por el usuario, 2026).
// Se muestra en /organizacion/organos-gobierno#decano.
export const decano = {
  nombre: "Dr. Mario Elder Chávez Bacilio",
  cargo: "Decano",
  facultad: "Facultad de Ciencias Físicas y Matemáticas"
};
