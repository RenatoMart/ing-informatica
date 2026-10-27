/**
 * Tipos compartidos del panel (DTO comunes de docs/DISENO_BACKEND.md §5) y
 * etiquetas/tonos de estado. Los tipos propios de cada módulo van en
 * `modelos/<modulo>.ts` (los crea su paquete).
 */
export type { ErroresCampos } from '../../lib/api';

// ── Respuestas ──────────────────────────────────────────────────────────────

export interface RespuestaDatos<T> {
  data: T;
}

export interface MetaPaginacion {
  pagina: number;
  por_pagina: number;
  total: number;
  ultima_pagina: number;
}

export interface Paginado<T> {
  data: T[];
  meta: MetaPaginacion;
}

/** Forma del cuerpo de error §5.1 (en el cliente se recibe como `ApiError`). */
export interface ErrorApi {
  codigo: string;
  mensaje: string;
  campos?: Record<string, string[]>;
}

export type CodigoError =
  | 'NO_AUTENTICADO'
  | 'SESION_REVOCADA'
  | 'ROL_NO_AUTORIZADO'
  | 'CUENTA_INACTIVA'
  | 'CAMBIO_CONTRASENA_REQUERIDO'
  | 'NO_ENCONTRADO'
  | 'SIN_CAMPANA_VIGENTE'
  | 'ESTADO_INVALIDO'
  | 'DUPLICADO'
  | 'CSRF_VENCIDO'
  | 'VALIDACION'
  | 'REGLA_NEGOCIO'
  | 'CREDENCIALES_INVALIDAS'
  | 'DEMASIADOS_INTENTOS'
  | 'RED'
  | 'ERROR_SERVIDOR';

/** Filtros de listados paginados (`?pagina&por_pagina&q&estado…`). */
export interface FiltrosPaginados {
  pagina?: number;
  por_pagina?: number;
  q?: string;
  estado?: string;
}

// ── Sesión y roles ──────────────────────────────────────────────────────────

export type Rol = 'Editor' | 'Revisor' | 'Administrador';
export const ROLES: Rol[] = ['Editor', 'Revisor', 'Administrador'];

/** Atajos para declarar permisos de rutas y menús (matriz §3.3). */
export const EDITORES: Rol[] = ['Editor', 'Revisor'];
export const TODOS: Rol[] = ['Editor', 'Revisor', 'Administrador'];

/** `GET /api/panel/auth/yo` → data. */
export interface UsuarioSesion {
  id_usuario: number;
  nombres: string;
  apellidos: string;
  correo_institucional: string;
  rol: Rol;
  rol_etiqueta: string;
  cargo: string | null;
  debe_cambiar_contrasena: boolean;
  permisos: string[];
}

// ── Revisión (§2) ───────────────────────────────────────────────────────────

export type EntidadRevisable = 'publicacion' | 'docente' | 'plan' | 'documento' | 'campana';
export type DecisionRevision = 'aprobar' | 'observar' | 'descartar';
export type OperacionPendiente = 'cambio' | 'baja' | null;

export type EstadoPublicacion = 'borrador' | 'en_revision' | 'publicada' | 'descartada' | 'despublicada';
export type EstadoDocente = 'borrador' | 'en_revision' | 'publicado' | 'inactivo';
export type EstadoPlan = 'borrador' | 'en_revision' | 'vigente' | 'historico' | 'descartado';
export type EstadoDocumento = 'en_revision' | 'vigente' | 'historico' | 'vencido' | 'no_publicado';
export type EstadoCampana = 'borrador' | 'en_revision' | 'vigente' | 'cerrada' | 'archivada';
export type EstadoRevision =
  | EstadoPublicacion
  | EstadoDocente
  | EstadoPlan
  | EstadoDocumento
  | EstadoCampana;

export type EstadoConsulta = 'recibida' | 'en_atencion' | 'atendida' | 'descartada' | 'derivada';
export type EstadoUsuario = 'activo' | 'inactivo';

/** `GET /revision/{entidad}/{id}/historial` → elemento. */
export interface EntradaHistorial {
  accion: string;
  estado_anterior: string | null;
  estado_nuevo: string;
  usuario: string;
  observaciones: string | null;
  fecha: string;
}

/** `GET /revision/pendientes` → elemento. */
export interface PendienteRevision {
  entidad: EntidadRevisable;
  id_registro: number;
  titulo: string;
  operacion: string | null;
  editor: string;
}

/** `GET /planes/{id}/validacion`, `/campanas/{id}/validacion` → elemento. */
export interface ItemValidacion {
  nivel: 'error' | 'advertencia' | string;
  codigo: string;
  mensaje: string;
}

export const ETIQUETA_ENTIDAD: Record<EntidadRevisable, string> = {
  publicacion: 'Publicación',
  docente: 'Docente',
  plan: 'Plan de estudios',
  documento: 'Documento',
  campana: 'Campaña de admisión',
};

// ── Etiquetas y tonos de estado ─────────────────────────────────────────────

export type TonoInsignia = 'neutro' | 'info' | 'aviso' | 'exito' | 'peligro' | 'primario' | 'apagado';

export const ETIQUETA_ESTADO: Record<string, string> = {
  borrador: 'Borrador',
  en_revision: 'En revisión',
  publicada: 'Publicada',
  publicado: 'Publicado',
  descartada: 'Descartada',
  descartado: 'Descartado',
  despublicada: 'Despublicada',
  inactivo: 'Inactivo',
  activo: 'Activo',
  vigente: 'Vigente',
  historico: 'Histórico',
  vencido: 'Vencido',
  no_publicado: 'No publicado',
  cerrada: 'Cerrada',
  archivada: 'Archivada',
  recibida: 'Recibida',
  en_atencion: 'En atención',
  atendida: 'Atendida',
  derivada: 'Derivada',
  pendiente: 'Pendiente',
  autorizada: 'Autorizada',
  denegada: 'Denegada',
  ejecutada: 'Ejecutada',
};

export const TONO_ESTADO: Record<string, TonoInsignia> = {
  borrador: 'neutro',
  en_revision: 'aviso',
  pendiente: 'aviso',
  recibida: 'aviso',
  publicada: 'exito',
  publicado: 'exito',
  vigente: 'exito',
  activo: 'exito',
  atendida: 'exito',
  autorizada: 'exito',
  ejecutada: 'primario',
  en_atencion: 'info',
  derivada: 'info',
  historico: 'primario',
  descartada: 'peligro',
  descartado: 'peligro',
  no_publicado: 'peligro',
  vencido: 'peligro',
  denegada: 'peligro',
  despublicada: 'apagado',
  inactivo: 'apagado',
  cerrada: 'apagado',
  archivada: 'apagado',
};

export const ETIQUETA_OPERACION: Record<string, string> = {
  cambio: 'Cambio pendiente',
  baja: 'Baja pendiente',
};

/** Etiqueta legible de un estado; si no se conoce, humaniza el literal. */
export function etiquetaEstado(estado: string): string {
  return ETIQUETA_ESTADO[estado] ?? estado.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
}

export function tonoEstado(estado: string): TonoInsignia {
  return TONO_ESTADO[estado] ?? 'neutro';
}
