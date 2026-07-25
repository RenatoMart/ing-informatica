// Plana docente. Cada docente:
//   - grado: el cargo/grado académico (Doctor, Magíster, Ingeniero…)
//   - departamento: el departamento académico al que pertenece (para filtrar/categorizar)
//   - cursoPrincipal: el curso/área principal que aparece en el FRENTE de la card
//   - especialidades: lista que aparece al voltear la card (reverso). Agrega 2-3 por docente.
//   - foto: ruta de la foto o null (muestra silueta placeholder)
//   - fotoPosicion: (opcional) encuadre de la foto (CSS object-position, ej. "center 25%").
//     Súbelo (menos %) si la foto tapa lo importante por abajo, bájalo (más %) si lo tapa
//     por arriba. Si no se define, usa "center 25%" por defecto.
//   - investigador: true si el docente es investigador (habilita el filtro "Investigadores")
//   - categoriaInvestigacion: categoría/nivel de investigación (p. ej. RENACYT). Solo aplica
//     si investigador === true; se muestra como distintivo en la card.
//   - condicion: régimen laboral del docente, "Nombrado" o "Contratado". Se muestra como
//     etiqueta en la card.


import IMG2 from '../assets/docentes/IMG_7617_resultado.webp';

export const docentes = [
  {
    nombre: "Nombre del Docente 1",
    grado: "Doctor",
    departamento: "Departamento Académico 1",
    cursoPrincipal: "Curso o área principal",
    especialidades: ["Especialidad 1", "Especialidad 2", "Especialidad 3"],
    foto: IMG2,
    fotoPosicion: "center 15%",
    investigador: true,
    categoriaInvestigacion: "RENACYT · Nivel I",
    condicion: "Nombrado"
  },
  {
    nombre: "Nombre del Docente 2",
    grado: "Doctora",
    departamento: "Departamento Académico 1",
    cursoPrincipal: "Curso o área principal",
    especialidades: ["Especialidad 1", "Especialidad 2"],
    foto: null,
    investigador: false,
    categoriaInvestigacion: null,
    condicion: "Nombrado"
  },
  {
    nombre: "Nombre del Docente 3",
    grado: "Magíster",
    departamento: "Departamento Académico 1",
    cursoPrincipal: "Curso o área principal",
    especialidades: ["Especialidad 1", "Especialidad 2"],
    foto: null,
    investigador: false,
    categoriaInvestigacion: null,
    condicion: "Contratado"
  },
  {
    nombre: "Nombre del Docente 4",
    grado: "Doctor",
    departamento: "Departamento Académico 1",
    cursoPrincipal: "Curso o área principal",
    especialidades: ["Especialidad 1", "Especialidad 2"],
    foto: null,
    investigador: true,
    categoriaInvestigacion: "RENACYT · Nivel II",
    condicion: "Nombrado"
  },
  {
    nombre: "Nombre del Docente 5",
    grado: "Magíster",
    departamento: "Departamento Académico 2",
    cursoPrincipal: "Curso o área principal",
    especialidades: ["Especialidad 1", "Especialidad 2"],
    foto: null,
    investigador: false,
    categoriaInvestigacion: null,
    condicion: "Contratado"
  },
  {
    nombre: "Nombre del Docente 6",
    grado: "Doctora",
    departamento: "Departamento Académico 2",
    cursoPrincipal: "Curso o área principal",
    especialidades: ["Especialidad 1", "Especialidad 2", "Especialidad 3"],
    foto: null,
    investigador: true,
    categoriaInvestigacion: "RENACYT · Nivel III",
    condicion: "Nombrado"
  },
  {
    nombre: "Nombre del Docente 7",
    grado: "Magíster",
    departamento: "Departamento Académico 2",
    cursoPrincipal: "Curso o área principal",
    especialidades: ["Especialidad 1", "Especialidad 2"],
    foto: null,
    investigador: false,
    categoriaInvestigacion: null,
    condicion: "Contratado"
  },
  {
    nombre: "Nombre del Docente 8",
    grado: "Doctor",
    departamento: "Departamento Académico 2",
    cursoPrincipal: "Curso o área principal",
    especialidades: ["Especialidad 1", "Especialidad 2"],
    foto: null,
    investigador: true,
    categoriaInvestigacion: "RENACYT · Nivel I",
    condicion: "Nombrado"
  },
  {
    nombre: "Nombre del Docente 9",
    grado: "Doctor",
    departamento: "Departamento Académico 2",
    cursoPrincipal: "Curso o área principal",
    especialidades: ["Especialidad 1", "Especialidad 2"],
    foto: null,
    investigador: true,
    categoriaInvestigacion: "RENACYT · Nivel IV",
    condicion: "Nombrado"
  },
  {
    nombre: "Nombre del Docente 10",
    grado: "Doctor",
    departamento: "Departamento Académico 1",
    cursoPrincipal: "Curso o área principal",
    especialidades: ["Especialidad 1", "Especialidad 2"],
    foto: null,
    investigador: false,
    categoriaInvestigacion: null,
    condicion: "Contratado"
  }
];
