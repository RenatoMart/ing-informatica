/**
 * Utilidades para validación de formularios
 */

export interface ContactoFormData {
  nombre: string;
  email: string;
  asunto: string;
  mensaje: string;
}

export type ContactoErrores = Partial<Record<keyof ContactoFormData, string>>;

export interface ResultadoValidacion {
  esValido: boolean;
  errores: ContactoErrores;
}

export function validarEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

export function validarTelefono(telefono: string): boolean {
  const regex = /^(\+51|0)?9\d{8}$/;
  return regex.test(telefono.replace(/\s/g, ''));
}

export function validarNombre(nombre: string): boolean {
  return Boolean(nombre && nombre.trim().length >= 2);
}

export function validarAsunto(asunto: string): boolean {
  return Boolean(asunto && asunto.trim().length >= 3);
}

export function validarMensaje(mensaje: string): boolean {
  return Boolean(mensaje && mensaje.trim().length >= 10);
}

export function validarFormularioContacto(formData: ContactoFormData): ResultadoValidacion {
  const errores: ContactoErrores = {};

  if (!validarNombre(formData.nombre)) {
    errores.nombre = 'El nombre debe tener al menos 2 caracteres';
  }

  if (!validarEmail(formData.email)) {
    errores.email = 'Por favor ingresa un email válido';
  }

  if (!validarAsunto(formData.asunto)) {
    errores.asunto = 'El asunto debe tener al menos 3 caracteres';
  }

  if (!validarMensaje(formData.mensaje)) {
    errores.mensaje = 'El mensaje debe tener al menos 10 caracteres';
  }

  return {
    esValido: Object.keys(errores).length === 0,
    errores
  };
}

export function validarURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
