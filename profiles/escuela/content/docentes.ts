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
//
// Fuente: fotos, correos y áreas de investigación tomados de inf.unitru.edu.pe (plana
// docente publicada); grados académicos y nombres completos verificados contra el
// "Currículo del Programa de Estudios de Informática" (R.C.U. No. 065-2018/UNT).
// `investigador` se deja en `false` por defecto (sin fuente confiable por docente) y
// no se consigna `categoriaInvestigacion`/`condicion`: ajústalos cuando tengas el dato
// exacto de cada uno.

import cruzSilva from '../assets/docentes/cruz-silva.jpg';
import sifuentesDiaz from '../assets/docentes/sifuentes-diaz.jpg';
import cruzFlorian from '../assets/docentes/cruz-florian.jpg';
import pedroHuaman from '../assets/docentes/pedro-huaman.jpg';
import castilloDiestra from '../assets/docentes/castillo-diestra.jpg';

export const docentes = [
  {
    nombre: "José Antonio Rodríguez Melquiades",
    grado: "Dr.",
    departamento: "Departamento Académico de Informática",
    cursoPrincipal: "Algoritmos, Complejidad y Lenguajes de Programación",
    especialidades: ["Algoritmos, complejidad y lenguajes de programación", "Optimización combinatoria"],
    foto: null,
    investigador: false,
  },
  {
    nombre: "José Gabriel Cruz Silva",
    grado: "Mg.",
    departamento: "Departamento Académico de Informática",
    cursoPrincipal: "Arquitectura y Organización de Computadoras",
    especialidades: ["Arquitectura y organización de computadoras"],
    foto: cruzSilva,
    investigador: false,
  },
  {
    nombre: "Yenny Milagritos Sifuentes Díaz",
    grado: "Mg.",
    departamento: "Departamento Académico de Informática",
    cursoPrincipal: "Ingeniería de Software",
    especialidades: ["Ingeniería de Software", "Lenguajes de Programación", "Simulación"],
    foto: sifuentesDiaz,
    investigador: false,
  },
  {
    nombre: "Iris Áurea Cruz Florián",
    grado: "Ing.",
    departamento: "Departamento Académico de Informática",
    cursoPrincipal: "Ingeniería de Software",
    especialidades: ["Ingeniería de Software", "Lenguajes de Programación", "Optimización Combinatoria"],
    foto: cruzFlorian,
    investigador: false,
  },
  {
    nombre: "Liz Sofía Raymunda Pedro Huamán",
    grado: "Mg.",
    departamento: "Departamento Académico de Informática",
    cursoPrincipal: "Sistemas Inteligentes",
    especialidades: ["Sistemas Inteligentes", "Ingeniería de software"],
    foto: pedroHuaman,
    investigador: false,
  },
  {
    nombre: "Carlos Enrique Castillo Diestra",
    grado: "Mg.",
    departamento: "Departamento Académico de Informática",
    cursoPrincipal: "Ingeniería de Software",
    especialidades: ["Ingeniería de Software", "Procesadores de Lenguajes", "Auditoría Informática"],
    foto: castilloDiestra,
    investigador: false,
  },
  {
    nombre: "Jorge Luis Alvarado Ramos",
    grado: "Ing.",
    departamento: "Departamento Académico de Informática",
    cursoPrincipal: "Departamento de Informática",
    foto: null,
    investigador: false,
  },
  {
    nombre: "Jorge Luis Gutiérrez Gutiérrez",
    grado: "Dr.",
    departamento: "Departamento Académico de Informática",
    cursoPrincipal: "Director del Departamento Académico de Informática",
    foto: null,
    investigador: false,
  },
  {
    nombre: "Edwin Ricardo Mendoza Torres",
    grado: "Mg.",
    departamento: "Departamento Académico de Informática",
    cursoPrincipal: "Director de la Escuela Profesional de Informática",
    foto: null,
    investigador: false,
  },
  {
    nombre: "Christian Araujo González",
    grado: "Ing.",
    departamento: "Departamento Académico de Informática",
    cursoPrincipal: "Departamento de Informática",
    foto: null,
    investigador: false,
  },
  {
    nombre: "Ricardo Martín Guevara Ruíz",
    grado: "Mg.",
    departamento: "Departamento Académico de Informática",
    cursoPrincipal: "Departamento de Informática",
    foto: null,
    investigador: false,
  },
  {
    nombre: "Anthony Junior Gómez Morales",
    grado: "Mg.",
    departamento: "Departamento Académico de Informática",
    cursoPrincipal: "Departamento de Informática",
    foto: null,
    investigador: false,
  },
  {
    nombre: "Jorge David Bravo Escalante",
    grado: "Mg.",
    departamento: "Departamento Académico de Informática",
    cursoPrincipal: "Departamento de Informática",
    foto: null,
    investigador: false,
  },
  {
    nombre: "José Andrés Díaz Pulido",
    grado: "Mg.",
    departamento: "Departamento Académico de Informática",
    cursoPrincipal: "Departamento de Informática",
    foto: null,
    investigador: false,
  },
  {
    nombre: "José Luis Peralta Luján",
    grado: "Mg.",
    departamento: "Departamento Académico de Informática",
    cursoPrincipal: "Departamento de Informática",
    foto: null,
    investigador: false,
  },
];
