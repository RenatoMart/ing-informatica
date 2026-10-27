/**
 * Controlador de HU1: usuarios, solicitudes de acceso y bitácora.
 * Hooks de TanStack Query + validaciones del diseño (§6.3). Nunca se elimina
 * un usuario: solo se desactiva (baja) con una solicitud autorizada.
 */
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { bitacoraApi } from '../api/bitacora';
import { solicitudesApi } from '../api/solicitudes';
import { usuariosApi } from '../api/usuarios';
import { useSesion } from '../sesion/SesionContext';
import type {
  DatosCrearUsuario,
  DatosEditarUsuario,
  DatosNuevaSolicitud,
  FiltrosBitacora,
  FiltrosSolicitudes,
  FiltrosUsuarios,
  SolicitudFila,
  TipoSolicitud,
} from '../modelos/usuarios';

const RAIZ = ['panel', 'usuarios-hu1'] as const;
export const CLAVES_USUARIOS = {
  roles: [...RAIZ, 'roles'] as const,
  usuarios: (f: FiltrosUsuarios) => [...RAIZ, 'usuarios', f] as const,
  solicitudes: (f: unknown) => [...RAIZ, 'solicitudes', f] as const,
  bitacora: (f: FiltrosBitacora) => [...RAIZ, 'bitacora', f] as const,
  todo: RAIZ,
};

export const POR_PAGINA = 15;

// ── Permisos (§3.3) ─────────────────────────────────────────────────────────

export function usePermisosUsuarios() {
  const { rol } = useSesion();
  return {
    puedeEjecutar: rol === 'Administrador', // alta, cambio de rol, baja, editar datos
    puedeAutorizar: rol === 'Revisor',
    puedeRegistrar: rol === 'Administrador' || rol === 'Revisor',
  };
}

// ── Consultas ───────────────────────────────────────────────────────────────

export function useRoles() {
  return useQuery({ queryKey: CLAVES_USUARIOS.roles, queryFn: usuariosApi.roles, staleTime: 10 * 60_000 });
}

export function useUsuarios(f: FiltrosUsuarios) {
  return useQuery({
    queryKey: CLAVES_USUARIOS.usuarios(f),
    queryFn: () => usuariosApi.listar({ por_pagina: POR_PAGINA, ...f }),
    placeholderData: keepPreviousData,
  });
}

export function useSolicitudes(f: FiltrosSolicitudes) {
  return useQuery({
    queryKey: CLAVES_USUARIOS.solicitudes(f),
    queryFn: () => solicitudesApi.listar({ por_pagina: POR_PAGINA, ...f }),
    placeholderData: keepPreviousData,
  });
}

export function esEjecutada(s: SolicitudFila): boolean {
  return Boolean(s.ejecutada || s.fecha_ejecucion);
}

/** Solicitudes autorizadas y aún no ejecutadas de un tipo (para elegir al ejecutar). */
export function useSolicitudesEjecutables(tipo: TipoSolicitud, activo: boolean, idObjetivo?: number) {
  return useQuery({
    queryKey: CLAVES_USUARIOS.solicitudes({ ejecutables: tipo, idObjetivo }),
    enabled: activo,
    queryFn: async () => {
      const r = await solicitudesApi.listar({ estado: 'autorizada', tipo, por_pagina: 100 });
      return r.data.filter(
        (s) =>
          !esEjecutada(s) &&
          s.tipo_solicitud === tipo &&
          (idObjetivo === undefined || s.id_usuario_objetivo === idObjetivo),
      );
    },
  });
}

export function useBitacora(f: FiltrosBitacora) {
  return useQuery({
    queryKey: CLAVES_USUARIOS.bitacora(f),
    queryFn: () => bitacoraApi.listar({ ...f, por_pagina: 20 }),
    placeholderData: keepPreviousData,
  });
}

// ── Mutaciones ──────────────────────────────────────────────────────────────

export function useAccionesUsuarios() {
  const qc = useQueryClient();
  const refrescar = () => qc.invalidateQueries({ queryKey: CLAVES_USUARIOS.todo });
  const opts = { onSuccess: refrescar };
  return {
    crearUsuario: useMutation({ mutationFn: (d: DatosCrearUsuario) => usuariosApi.crear(d), ...opts }),
    editarUsuario: useMutation({
      mutationFn: ({ id, datos }: { id: number; datos: DatosEditarUsuario }) => usuariosApi.editar(id, datos),
      ...opts,
    }),
    cambiarRol: useMutation({
      mutationFn: ({ id, id_solicitud }: { id: number; id_solicitud: number }) =>
        usuariosApi.cambiarRol(id, id_solicitud),
      ...opts,
    }),
    desactivar: useMutation({
      mutationFn: ({ id, id_solicitud }: { id: number; id_solicitud: number }) =>
        usuariosApi.desactivar(id, id_solicitud),
      ...opts,
    }),
    registrarSolicitud: useMutation({
      mutationFn: (d: DatosNuevaSolicitud) => solicitudesApi.registrar(d),
      ...opts,
    }),
    autorizar: useMutation({
      mutationFn: ({ id, observacion }: { id: number; observacion?: string }) =>
        solicitudesApi.autorizar(id, observacion),
      ...opts,
    }),
    denegar: useMutation({
      mutationFn: ({ id, observacion }: { id: number; observacion: string }) =>
        solicitudesApi.denegar(id, observacion),
      ...opts,
    }),
  };
}

// ── Validaciones ────────────────────────────────────────────────────────────

const RE_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Dominio institucional (se toma del correo de la sesión). */
export function dominioDe(correo: string | undefined | null): string | null {
  const i = correo?.lastIndexOf('@') ?? -1;
  return correo && i > 0 ? correo.slice(i + 1).toLowerCase() : null;
}

export function validarSolicitud(
  d: {
    solicitante_nombre: string;
    tipo_solicitud: TipoSolicitud | '';
    id_rol_solicitado: string;
    motivo: string;
    correo_solicitado: string;
    id_usuario_objetivo: string;
  },
  dominio: string | null,
): Record<string, string> {
  const e: Record<string, string> = {};
  if (d.solicitante_nombre.trim().length < 3) e.solicitante_nombre = 'Ingrese el nombre del solicitante (mínimo 3 caracteres).';
  if (!d.tipo_solicitud) e.tipo_solicitud = 'Seleccione el tipo de solicitud.';
  if (d.tipo_solicitud !== 'baja' && !d.id_rol_solicitado) e.id_rol_solicitado = 'Seleccione el rol solicitado.';
  if (d.tipo_solicitud === 'alta') {
    const c = d.correo_solicitado.trim().toLowerCase();
    if (!c) e.correo_solicitado = 'Ingrese el correo institucional.';
    else if (!RE_CORREO.test(c)) e.correo_solicitado = 'Ingrese un correo válido.';
    else if (dominio && !c.endsWith(`@${dominio}`)) e.correo_solicitado = `El correo debe ser del dominio institucional (@${dominio}).`;
  }
  if ((d.tipo_solicitud === 'cambio_rol' || d.tipo_solicitud === 'baja') && !d.id_usuario_objetivo)
    e.id_usuario_objetivo = 'Seleccione el usuario afectado.';
  if (!d.motivo.trim()) e.motivo = 'El motivo es obligatorio.';
  else if (d.motivo.length > 500) e.motivo = 'El motivo no debe superar 500 caracteres.';
  return e;
}

export function validarDatosUsuario(d: { nombres: string; apellidos: string; cargo: string }): Record<string, string> {
  const e: Record<string, string> = {};
  if (!d.nombres.trim()) e.nombres = 'Los nombres son obligatorios.';
  if (!d.apellidos.trim()) e.apellidos = 'Los apellidos son obligatorios.';
  if (d.cargo.length > 100) e.cargo = 'El cargo no debe superar 100 caracteres.';
  return e;
}

export function validarObservacionDenegar(obs: string): string | null {
  return obs.trim().length < 5 ? 'La observación es obligatoria (mínimo 5 caracteres).' : null;
}
