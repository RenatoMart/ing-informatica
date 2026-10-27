/**
 * Controlador (MVC, Sprint 3) de autenticación: login, cierre de sesión,
 * cambio de contraseña, recuperación y restablecimiento (`/api/panel/auth/*`).
 * Las vistas solo renderizan y llaman a `acciones`.
 */
import { useMutation } from '@tanstack/react-query';
import { apiPanel, esApiError } from '../../lib/api';
import { useSesion } from '../sesion/SesionContext';
import type { RespuestaDatos, UsuarioSesion } from '../modelos/comunes';

// ── Modelo: payloads ────────────────────────────────────────────────────────

export interface DatosLogin {
  correo: string;
  contrasena: string;
}
export interface DatosCambioContrasena {
  contrasena_actual: string;
  contrasena_nueva: string;
  contrasena_nueva_confirmation: string;
}
export interface DatosRestablecer {
  correo: string;
  token: string;
  contrasena_nueva: string;
  contrasena_nueva_confirmation: string;
}

// ── Modelo: validaciones del cliente (replican las del dominio) ──────────────

const RE_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validarCorreo(correo: string): string | null {
  if (!correo.trim()) return 'Ingrese su correo institucional.';
  if (!RE_CORREO.test(correo.trim())) return 'Ingrese un correo válido.';
  return null;
}

/** Reglas de contraseña (§6.3): ≥10 caracteres, con letra y dígito. */
export const REGLAS_CONTRASENA = [
  { id: 'largo', texto: 'Al menos 10 caracteres', cumple: (s: string) => s.length >= 10 },
  { id: 'letra', texto: 'Al menos una letra', cumple: (s: string) => /\p{L}/u.test(s) },
  { id: 'digito', texto: 'Al menos un número', cumple: (s: string) => /\d/.test(s) },
] as const;

export function validarNuevaContrasena(
  nueva: string,
  confirmacion: string,
  actual?: string,
): Record<string, string> {
  const e: Record<string, string> = {};
  if (!nueva) e.contrasena_nueva = 'Ingrese la nueva contraseña.';
  else if (REGLAS_CONTRASENA.some((r) => !r.cumple(nueva)))
    e.contrasena_nueva = 'La contraseña debe tener al menos 10 caracteres, con letras y números.';
  else if (actual !== undefined && actual && nueva === actual)
    e.contrasena_nueva = 'La nueva contraseña debe ser distinta de la actual.';
  if (!confirmacion) e.contrasena_nueva_confirmation = 'Confirme la nueva contraseña.';
  else if (confirmacion !== nueva) e.contrasena_nueva_confirmation = 'Las contraseñas no coinciden.';
  return e;
}

/** Mensajes en español para los códigos de error de autenticación. */
export function mensajeLogin(error: unknown): string | null {
  if (!error) return null;
  if (!esApiError(error)) return 'Ocurrió un error inesperado.';
  switch (error.codigo) {
    case 'CREDENCIALES_INVALIDAS':
      return 'El correo o la contraseña no son correctos.';
    case 'CUENTA_INACTIVA':
      return 'Su cuenta está inactiva. Comuníquese con la Dirección de Escuela.';
    case 'DEMASIADOS_INTENTOS':
      return 'Demasiados intentos fallidos. Espere un minuto e intente de nuevo.';
    default:
      return error.mensaje;
  }
}

// ── Controlador ─────────────────────────────────────────────────────────────

export function useAutenticacionController() {
  const sesion = useSesion();

  const login = useMutation({
    mutationFn: async (datos: DatosLogin) => {
      const r = await apiPanel.post<RespuestaDatos<{ usuario: UsuarioSesion } | UsuarioSesion>>('/auth/login', {
        correo: datos.correo.trim(),
        contrasena: datos.contrasena,
      });
      const d = r?.data as { usuario?: UsuarioSesion } | UsuarioSesion | undefined;
      return (d && 'usuario' in d ? d.usuario : (d as UsuarioSesion | undefined)) ?? null;
    },
    // La redirección la hace RutaInvitado al detectar sesión.
    onSuccess: async (usuario) => {
      if (usuario) sesion.establecerUsuario(usuario);
      else await sesion.refrescar();
    },
  });

  const logout = useMutation({
    mutationFn: () => apiPanel.post<void>('/auth/logout', undefined, { silenciar401: true }),
    // Aunque falle (sesión ya vencida), se limpia la sesión local.
    onSettled: () => sesion.limpiar(),
  });

  const cambiarContrasena = useMutation({
    mutationFn: (datos: DatosCambioContrasena) => apiPanel.post<void>('/auth/cambiar-contrasena', datos),
    // Se actualiza la sesión en memoria al instante (para que RutaProtegida no
    // vuelva a exigir el cambio) y luego se revalida `auth/yo`.
    onSuccess: () => {
      if (sesion.usuario) sesion.establecerUsuario({ ...sesion.usuario, debe_cambiar_contrasena: false });
      else void sesion.refrescar();
    },
  });

  const recuperar = useMutation({
    mutationFn: (correo: string) => apiPanel.post<void>('/auth/recuperar', { correo: correo.trim() }),
  });

  const restablecer = useMutation({
    mutationFn: (datos: DatosRestablecer) => apiPanel.post<void>('/auth/restablecer', datos),
  });

  return {
    sesion,
    estado: {
      iniciando: login.isPending,
      cerrando: logout.isPending,
      cambiando: cambiarContrasena.isPending,
      recuperando: recuperar.isPending,
      restableciendo: restablecer.isPending,
      recuperacionEnviada: recuperar.isSuccess,
      restablecida: restablecer.isSuccess,
      contrasenaCambiada: cambiarContrasena.isSuccess,
    },
    errores: {
      login: login.error,
      cambiarContrasena: cambiarContrasena.error,
      recuperar: recuperar.error,
      restablecer: restablecer.error,
    },
    acciones: {
      iniciarSesion: (d: DatosLogin) => login.mutateAsync(d),
      cerrarSesion: () => logout.mutateAsync().catch(() => undefined),
      cambiarContrasena: (d: DatosCambioContrasena) => cambiarContrasena.mutateAsync(d),
      recuperar: (correo: string) => recuperar.mutateAsync(correo),
      restablecer: (d: DatosRestablecer) => restablecer.mutateAsync(d),
      reiniciarErrores: () => {
        login.reset();
        cambiarContrasena.reset();
        recuperar.reset();
        restablecer.reset();
      },
    },
  };
}
