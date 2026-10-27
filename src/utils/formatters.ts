/**
 * Utilidades para formateo de textos, fechas, etc.
 */

export function formatearFecha(fecha: string | number | Date, formato = 'DD/MM/YYYY'): string {
  if (!fecha) return '';

  const date = new Date(fecha);
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = String(date.getFullYear());

  return formato
    .replace('DD', dd)
    .replace('MM', mm)
    .replace('YYYY', yyyy);
}

export function truncarTexto(texto: string, limiteCaracteres = 100): string {
  if (!texto || texto.length <= limiteCaracteres) return texto;
  return texto.substring(0, limiteCaracteres) + '...';
}

export function capitalizarPrimera(texto: string): string {
  if (!texto) return '';
  return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
}

export function convertirASlug(texto: string): string {
  if (!texto) return '';
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '')
    .replace(/-+/g, '-');
}

export function formatearTelefono(telefono: string): string {
  if (!telefono) return '';
  const cleaned = telefono.replace(/\D/g, '');
  if (cleaned.length === 9) {
    return `+51 ${cleaned.slice(0, 1)} ${cleaned.slice(1, 4)} ${cleaned.slice(4)}`;
  }
  return telefono;
}

export function formatearEmail(email: string): string {
  if (!email) return '';
  return email.toLowerCase().trim();
}
