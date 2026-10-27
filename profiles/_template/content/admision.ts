// Forma: ver profiles/escuela/content/admision.ts
// Contenido del panel lateral de Admisión (FloatingAdmissions).
export interface ModalidadAdmision {
  titulo: string;
  dirigidoA: string;
  vacantes: string;
  descripcion: string;
}

export interface InfoUtilItem {
  titulo: string;
  detalle: string;
}

export const modalidadesAdmision: ModalidadAdmision[] = [];
export const infoUtilAdmision: InfoUtilItem[] = [];
export const portalAdmision = { label: '[Portal de Admisión]', url: 'https://' };
