import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSesion } from './SesionContext';
import type { Rol } from '../modelos/comunes';
import { Cargando } from '../componentes/Estados';
import PaginaNoAutorizado from '../vistas/PaginaNoAutorizado';

const RUTA_CAMBIAR = '/panel/cambiar-contrasena';

interface Props {
  /** Roles permitidos. Si se omite, basta con estar autenticado. */
  roles?: readonly Rol[];
  /** Permite entrar aunque `debe_cambiar_contrasena` sea true (solo la pantalla de cambio). */
  permitirCambioPendiente?: boolean;
  /** Si no hay children se renderiza `<Outlet/>`. */
  children?: ReactNode;
}

/**
 * Guardia del panel:
 * - sin sesión → `/panel/login?volver=<ruta actual>`
 * - `debe_cambiar_contrasena` → `/panel/cambiar-contrasena`
 * - rol fuera de `roles` → pantalla "No autorizado" (sin cambiar la URL)
 */
export function RutaProtegida({ roles, permitirCambioPendiente = false, children }: Props) {
  const { usuario, cargando } = useSesion();
  const ubicacion = useLocation();

  if (cargando) return <Cargando pantallaCompleta etiqueta="Verificando sesión…" />;

  if (!usuario) {
    const volver = encodeURIComponent(ubicacion.pathname + ubicacion.search);
    return <Navigate to={`/panel/login?volver=${volver}`} replace />;
  }

  if (usuario.debe_cambiar_contrasena && !permitirCambioPendiente && ubicacion.pathname !== RUTA_CAMBIAR) {
    return <Navigate to={RUTA_CAMBIAR} replace />;
  }

  if (roles && !roles.includes(usuario.rol)) return <PaginaNoAutorizado />;

  return children ? <>{children}</> : <Outlet />;
}

/** Destino seguro tras iniciar sesión: solo rutas internas del panel. */
export function destinoSeguro(volver: string | null): string {
  if (!volver) return '/panel';
  return /^\/panel(\/|$|\?)/.test(volver) && !volver.startsWith('/panel/login') ? volver : '/panel';
}

/**
 * Para login/recuperar/restablecer: si ya hay sesión, lleva al panel (o a
 * `?volver=`, o al cambio de contraseña si es obligatorio).
 */
export function RutaInvitado({ children }: { children?: ReactNode }) {
  const { usuario, cargando } = useSesion();
  const ubicacion = useLocation();
  if (cargando) return <Cargando pantallaCompleta etiqueta="Verificando sesión…" />;
  if (usuario) {
    const volver = new URLSearchParams(ubicacion.search).get('volver');
    return <Navigate to={usuario.debe_cambiar_contrasena ? RUTA_CAMBIAR : destinoSeguro(volver)} replace />;
  }
  return children ? <>{children}</> : <Outlet />;
}

export default RutaProtegida;
