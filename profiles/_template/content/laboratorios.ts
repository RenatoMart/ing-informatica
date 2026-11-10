// Laboratorios y talleres de la escuela. Se administran desde el panel (sección «Laboratorios»);
// este archivo es solo el respaldo si la API no responde. Vacío a propósito: no se inventan datos.
export interface LaboratorioFoto {
  src: string;
  alt: string;
  /** object-position del encuadre, p. ej. '50% 35%'. */
  position?: string;
}

export interface Laboratorio {
  nombre: string;
  tipo: 'Laboratorio' | 'Taller';
  descripcion: string;
  imagen: string | null;
}

/** Fotos del carrusel de la portada. */
export const laboratoriosFotos: LaboratorioFoto[] = [];

export const laboratoriosPortada = { pie: '' };

export const laboratorios: Laboratorio[] = [];
