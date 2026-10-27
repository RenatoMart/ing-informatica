/** Tipos de HU1 (usuarios, solicitudes de acceso y bitácora). Contrato: DISENO_BACKEND §5.2. */
import type { EstadoUsuario, Rol } from './comunes';

export interface RolInfo {
  id_rol: number;
  nombre: string;
  descripcion?: string | null;
}

export interface UsuarioFila {
  id_usuario: number;
  nombres: string;
  apellidos: string;
  correo_institucional: string;
  rol: string;
  cargo: string | null;
  estado: EstadoUsuario;
  debe_cambiar_contrasena: boolean;
  fecha_creacion: string;
}

export interface EntradaBitacora {
  id_bitacora: number;
  usuario: string | null;
  actor: string | null;
  accion: string;
  detalle: string | null;
  ip: string | null;
  fecha: string;
}

export interface UsuarioDetalle extends UsuarioFila {
  bitacora?: EntradaBitacora[];
}

export type TipoSolicitud = 'alta' | 'cambio_rol' | 'baja';
export type EstadoSolicitud = 'pendiente' | 'autorizada' | 'denegada';

export const TIPOS_SOLICITUD: { valor: TipoSolicitud; etiqueta: string }[] = [
  { valor: 'alta', etiqueta: 'Alta de usuario' },
  { valor: 'cambio_rol', etiqueta: 'Cambio de rol' },
  { valor: 'baja', etiqueta: 'Baja de usuario' },
];

export const ETIQUETA_TIPO_SOLICITUD: Record<string, string> = {
  alta: 'Alta',
  cambio_rol: 'Cambio de rol',
  baja: 'Baja',
};

/** Fila de `GET /solicitudes` (los campos opcionales dependen de la implementación del backend). */
export interface SolicitudFila {
  id_solicitud: number;
  solicitante_nombre: string;
  tipo_solicitud: TipoSolicitud | string;
  estado: EstadoSolicitud | string;
  id_rol_solicitado?: number | null;
  rol_solicitado?: string | null;
  correo_solicitado?: string | null;
  id_usuario_objetivo?: number | null;
  usuario_objetivo?: string | null;
  motivo: string;
  observacion?: string | null;
  fecha_solicitud?: string | null;
  fecha_resolucion?: string | null;
  fecha_ejecucion?: string | null;
  ejecutada?: boolean;
}

export interface DatosNuevaSolicitud {
  solicitante_nombre: string;
  tipo_solicitud: TipoSolicitud;
  id_rol_solicitado: number;
  motivo: string;
  correo_solicitado?: string;
  id_usuario_objetivo?: number;
}

export interface DatosCrearUsuario {
  id_solicitud: number;
  nombres: string;
  apellidos: string;
  cargo?: string;
}

export interface DatosEditarUsuario {
  nombres: string;
  apellidos: string;
  cargo: string;
}

export interface FiltrosUsuarios {
  por_pagina?: number;
  pagina?: number;
  q?: string;
  estado?: string;
  rol?: string;
}
export interface FiltrosSolicitudes {
  por_pagina?: number;
  pagina?: number;
  estado?: string;
  tipo?: string;
}
export interface FiltrosBitacora {
  por_pagina?: number;
  pagina?: number;
  accion?: string;
  desde?: string;
  hasta?: string;
}

export const ACCIONES_BITACORA: { valor: string; etiqueta: string }[] = [
  { valor: 'inicio_sesion', etiqueta: 'Inicio de sesión' },
  { valor: 'cierre_sesion', etiqueta: 'Cierre de sesión' },
  { valor: 'acceso_fallido', etiqueta: 'Acceso fallido' },
  { valor: 'cambio_contrasena', etiqueta: 'Cambio de contraseña' },
  { valor: 'recuperacion', etiqueta: 'Recuperación de acceso' },
  { valor: 'alta', etiqueta: 'Alta' },
  { valor: 'cambio_rol', etiqueta: 'Cambio de rol' },
  { valor: 'baja', etiqueta: 'Baja' },
  { valor: 'edicion_datos', etiqueta: 'Edición de datos' },
  { valor: 'denegado', etiqueta: 'Solicitud denegada' },
];

export function etiquetaAccion(accion: string): string {
  return ACCIONES_BITACORA.find((a) => a.valor === accion)?.etiqueta ?? accion.replace(/_/g, ' ');
}

export function normalizarRolNombre(r: string): Rol | string {
  const x = r.toLowerCase();
  if (x.startsWith('admin')) return 'Administrador';
  if (x.startsWith('revis')) return 'Revisor';
  if (x.startsWith('edit')) return 'Editor';
  return r;
}
