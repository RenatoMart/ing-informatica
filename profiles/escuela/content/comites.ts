// Comités de la escuela. Los integrantes se administran desde el panel (sección «Comités»);
// este archivo es el respaldo y fija el `id` que usan los anclajes del menú (config/navigation.ts).
// Un comité sin integrantes se muestra como «En construcción».
export interface ComiteMiembro {
  nombre: string;
  /** Presidente | Responsable | Secretario | Miembro | Estudiante */
  rol: string;
  /** Dr. · Dra. · Mg. · Ing. (los estudiantes no lo llevan) */
  grado?: string;
}

export interface Comite {
  id: string;
  titulo: string;
  descripcion?: string;
  /** Resolución que lo conforma (se muestra bajo el título). */
  resolucion?: string;
  miembros: ComiteMiembro[];
}

export const comites: Comite[] = [
  { id: 'calidad', titulo: 'Comité de Calidad', descripcion: 'Autoevaluación y acreditación de la calidad del programa.', miembros: [] },
  { id: 'curriculo', titulo: 'Comité Técnico de Currículo', miembros: [] },
  { id: 'tutoria', titulo: 'Comité de Tutoría y Consejería', miembros: [] },
  { id: 'egresado', titulo: 'Comité de Seguimiento al Egresado', miembros: [] },
  { id: 'investigacion', titulo: 'Comité de Investigación', miembros: [] },
  { id: 'responsabilidad', titulo: 'Comité de Responsabilidad Social', miembros: [] },
];
