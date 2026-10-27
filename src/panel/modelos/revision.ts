/** Tipos de la bandeja de revisión (§2, §5.2). */
import type { DecisionRevision, EntidadRevisable } from './comunes';

export interface DatosDecidir {
  entidad: EntidadRevisable;
  id: number;
  decision: DecisionRevision;
  observaciones?: string;
  como_vigente?: boolean;
}

/** Detalle del registro: se muestra de forma genérica (campo → valor). */
export type DetalleRegistro = Record<string, unknown> & {
  cambios_pendientes?: Record<string, unknown> | null;
  operacion_pendiente?: string | null;
  estado?: string;
};

/** Ruta de la API que devuelve el detalle de cada entidad. */
export const RUTA_DETALLE: Record<EntidadRevisable, string> = {
  publicacion: '/publicaciones',
  docente: '/docentes',
  plan: '/planes',
  documento: '/documentos',
  campana: '/campanas',
};

/** Pantalla del panel donde se edita/visualiza cada entidad. */
export const RUTA_PANTALLA: Record<EntidadRevisable, string> = {
  publicacion: '/panel/publicaciones',
  docente: '/panel/docentes',
  plan: '/panel/plan',
  documento: '/panel/documentos',
  campana: '/panel/campanas',
};

export const ENTIDADES_ORDEN: EntidadRevisable[] = ['publicacion', 'docente', 'plan', 'documento', 'campana'];
