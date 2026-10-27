import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiPanel, configurarApi, esApiError } from '../../lib/api';
import type { RespuestaDatos, Rol, UsuarioSesion } from '../modelos/comunes';

/** Clave de la sesión en el caché de TanStack Query (solo memoria). */
export const CLAVE_SESION = ['sesion'] as const;

export interface ValorSesion {
  usuario: UsuarioSesion | null;
  /** true mientras se consulta `auth/yo` por primera vez. */
  cargando: boolean;
  autenticado: boolean;
  rol: Rol | null;
  cargo: string | null;
  permisos: string[];
  debeCambiarContrasena: boolean;
  tieneRol: (...roles: Rol[]) => boolean;
  tienePermiso: (permiso: string) => boolean;
  /** Fija el usuario en memoria (p.ej. tras el login) y revalida `auth/yo`. */
  establecerUsuario: (usuario: UsuarioSesion | null) => void;
  /** Vuelve a consultar `auth/yo`. */
  refrescar: () => Promise<unknown>;
  /** Limpia la sesión local y el caché del panel (no llama a la API). */
  limpiar: () => void;
}

const SesionContext = createContext<ValorSesion | null>(null);

/** Acepta el rol en cualquier capitalización ("editor", "EDITOR"…). */
function normalizarRol(rol: unknown): Rol {
  const r = String(rol ?? '').toLowerCase();
  if (r.startsWith('admin')) return 'Administrador';
  if (r.startsWith('revis')) return 'Revisor';
  return 'Editor';
}

export function normalizarUsuario(u: UsuarioSesion): UsuarioSesion {
  return { ...u, rol: normalizarRol(u.rol), permisos: Array.isArray(u.permisos) ? u.permisos : [] };
}

async function consultarYo(): Promise<UsuarioSesion | null> {
  try {
    const r = await apiPanel.get<RespuestaDatos<UsuarioSesion>>('/auth/yo', { silenciar401: true });
    return r?.data ? normalizarUsuario(r.data) : null;
  } catch (e) {
    if (esApiError(e) && e.status === 401) return null;
    throw e;
  }
}

export function SesionProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const consulta = useQuery({
    queryKey: CLAVE_SESION,
    queryFn: consultarYo,
    staleTime: 5 * 60_000,
    retry: false,
    refetchOnWindowFocus: true,
  });

  const limpiar = useCallback(() => {
    qc.removeQueries({ queryKey: ['panel'] });
    qc.setQueryData(CLAVE_SESION, null);
  }, [qc]);

  const establecerUsuario = useCallback(
    (usuario: UsuarioSesion | null) => {
      qc.setQueryData(CLAVE_SESION, usuario ? normalizarUsuario(usuario) : null);
      if (usuario) void qc.invalidateQueries({ queryKey: CLAVE_SESION });
    },
    [qc],
  );

  const refrescar = useCallback(() => qc.invalidateQueries({ queryKey: CLAVE_SESION }), [qc]);

  // 401 en cualquier petición → sesión local a null; RutaProtegida redirige al login.
  // 403 CAMBIO_CONTRASENA_REQUERIDO → se revalida `auth/yo` (RutaProtegida redirige).
  useEffect(
    () =>
      configurarApi({
        alNoAutenticado: () => limpiar(),
        alCambioContrasenaRequerido: () => void refrescar(),
      }),
    [limpiar, refrescar],
  );

  const usuario = consulta.data ?? null;
  const valor = useMemo<ValorSesion>(
    () => ({
      usuario,
      cargando: consulta.isPending,
      autenticado: usuario !== null,
      rol: usuario?.rol ?? null,
      cargo: usuario?.cargo ?? null,
      permisos: usuario?.permisos ?? [],
      debeCambiarContrasena: usuario?.debe_cambiar_contrasena ?? false,
      tieneRol: (...roles) => !!usuario && roles.includes(usuario.rol),
      tienePermiso: (p) => !!usuario && usuario.permisos.includes(p),
      establecerUsuario,
      refrescar,
      limpiar,
    }),
    [usuario, consulta.isPending, establecerUsuario, refrescar, limpiar],
  );

  return <SesionContext.Provider value={valor}>{children}</SesionContext.Provider>;
}

/** Sesión actual del panel. Debe usarse dentro de `SesionProvider` (PanelApp). */
export function useSesion(): ValorSesion {
  const ctx = useContext(SesionContext);
  if (!ctx) throw new Error('useSesion debe usarse dentro de <SesionProvider>.');
  return ctx;
}
