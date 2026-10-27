/**
 * Modelo de Publicaciones (HU2, P1/P2): tipos del contrato §5.2, reglas de
 * negocio del cliente (replican las del dominio) y permisos por estado.
 */
import type { EstadoPublicacion, OperacionPendiente } from './comunes';

export interface FilaPublicacion {
  id_publicacion: number;
  titulo: string;
  categoria: string | null;
  estado: EstadoPublicacion;
  operacion_pendiente: OperacionPendiente;
  fecha_creacion: string;
  fecha_publicacion_programada: string | null;
  editor: string;
  imagen_portada_url: string | null;
}

export interface ArchivoPublicacion {
  id_archivo: number;
  url: string;
  ancho_px: number;
  alto_px: number;
}

export interface CambiosPublicacion {
  titulo?: string;
  resumen?: string | null;
  contenido?: string | null;
  categoria?: string | null;
  fecha_publicacion_programada?: string | null;
  [clave: string]: unknown;
}

export interface DetallePublicacion extends FilaPublicacion {
  resumen: string | null;
  contenido: string | null;
  archivos: ArchivoPublicacion[];
  cambios_pendientes: CambiosPublicacion | null;
  observaciones_revision: string | null;
  fecha_decision?: string | null;
}

/** Cuerpo de POST/PUT `/publicaciones`. */
export interface DatosPublicacion {
  titulo: string;
  resumen: string | null;
  contenido: string | null;
  categoria: string | null;
  fecha_publicacion_programada: string | null;
}

/** Estado del formulario (textos siempre string). */
export interface FormPublicacion {
  titulo: string;
  resumen: string;
  contenido: string;
  categoria: string;
  fecha: string;
}

export interface FiltrosPublicaciones {
  estado: string;
  categoria: string;
  q: string;
  pagina: number;
}

export const FORM_PUBLICACION_VACIO: FormPublicacion = {
  titulo: '',
  resumen: '',
  contenido: '',
  categoria: '',
  fecha: '',
};

export const LIMITES_PUBLICACION = {
  tituloMin: 5,
  tituloMax: 200,
  resumenMax: 500,
  categoriaMax: 100,
  maxImagenes: 6,
  imagenMB: 5,
  imagenAncho: 600,
  imagenAlto: 400,
} as const;

export const ESTADOS_PUBLICACION: EstadoPublicacion[] = [
  'borrador',
  'en_revision',
  'publicada',
  'descartada',
  'despublicada',
];

export const FORMATOS_IMAGEN = 'image/jpeg,image/png,image/webp';

/** Fecha local de hoy en formato `YYYY-MM-DD`. */
export function hoyISO(): string {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

/** Formatea `YYYY-MM-DD` o ISO como `dd/mm/aaaa` (sin desfase de zona horaria). */
export function formatoFecha(valor: string | null | undefined): string {
  if (!valor) return '—';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(valor);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  const d = new Date(valor);
  return Number.isNaN(d.getTime()) ? valor : d.toLocaleDateString('es-PE');
}

/** Formulario inicial: la propuesta de cambio pendiente prevalece sobre lo publicado. */
export function formDesdeDetalle(d: DetallePublicacion): FormPublicacion {
  const c = d.operacion_pendiente === 'cambio' ? d.cambios_pendientes : null;
  const texto = (propio: string | null | undefined, clave: keyof CambiosPublicacion) => {
    const v = c?.[clave];
    return typeof v === 'string' ? v : (propio ?? '');
  };
  return {
    titulo: texto(d.titulo, 'titulo'),
    resumen: texto(d.resumen, 'resumen'),
    contenido: texto(d.contenido, 'contenido'),
    categoria: texto(d.categoria, 'categoria'),
    fecha: (texto(d.fecha_publicacion_programada, 'fecha_publicacion_programada') || '').slice(0, 10),
  };
}

export function datosDesdeForm(f: FormPublicacion): DatosPublicacion {
  const o = (s: string) => (s.trim() ? s.trim() : null);
  return {
    titulo: f.titulo.trim(),
    resumen: o(f.resumen),
    contenido: o(f.contenido),
    categoria: o(f.categoria),
    fecha_publicacion_programada: f.fecha || null,
  };
}

/**
 * Validaciones del cliente (§6.3). `paraEnviar` exige resumen, categoría y al
 * menos una imagen. La fecha solo se exige ≥ hoy si cambió respecto a la original.
 */
export function validarPublicacion(
  f: FormPublicacion,
  opciones: { paraEnviar?: boolean; tieneImagen?: boolean; fechaOriginal?: string } = {},
): Record<string, string> {
  const e: Record<string, string> = {};
  const titulo = f.titulo.trim();
  if (!titulo) e.titulo = 'El título es obligatorio.';
  else if (titulo.length < LIMITES_PUBLICACION.tituloMin)
    e.titulo = `El título debe tener al menos ${LIMITES_PUBLICACION.tituloMin} caracteres.`;
  else if (titulo.length > LIMITES_PUBLICACION.tituloMax)
    e.titulo = `El título no puede superar ${LIMITES_PUBLICACION.tituloMax} caracteres.`;
  if (f.resumen.length > LIMITES_PUBLICACION.resumenMax)
    e.resumen = `El resumen no puede superar ${LIMITES_PUBLICACION.resumenMax} caracteres.`;
  if (f.categoria.length > LIMITES_PUBLICACION.categoriaMax)
    e.categoria = `La categoría no puede superar ${LIMITES_PUBLICACION.categoriaMax} caracteres.`;
  if (f.fecha && f.fecha !== (opciones.fechaOriginal ?? '') && f.fecha < hoyISO())
    e.fecha = 'La fecha programada no puede ser anterior a hoy.';
  if (opciones.paraEnviar) {
    if (!f.resumen.trim()) e.resumen = e.resumen ?? 'El resumen es obligatorio para enviar a revisión.';
    if (!f.categoria.trim()) e.categoria = e.categoria ?? 'La categoría es obligatoria para enviar a revisión.';
    if (!opciones.tieneImagen) e.imagen = 'Agregue al menos una imagen para enviar a revisión.';
  }
  return e;
}

// ── Permisos por estado ─────────────────────────────────────────────────────

export interface AccionesPublicacion {
  /** El formulario es editable (borrador directo; publicada como cambio pendiente). */
  editar: boolean;
  /** Guardar crea una propuesta de cambio (no modifica lo publicado). */
  esCambio: boolean;
  enviarRevision: boolean;
  solicitarBaja: boolean;
  descartar: boolean;
}

export function accionesPermitidas(
  estado: EstadoPublicacion | undefined,
  operacion: OperacionPendiente | undefined,
): AccionesPublicacion {
  const ninguna: AccionesPublicacion = {
    editar: false,
    esCambio: false,
    enviarRevision: false,
    solicitarBaja: false,
    descartar: false,
  };
  if (!estado) return { ...ninguna, editar: true, enviarRevision: false }; // nueva
  if (estado === 'borrador') return { editar: true, esCambio: false, enviarRevision: true, solicitarBaja: false, descartar: true };
  if (estado === 'publicada') {
    if (operacion === 'baja') return ninguna;
    return { ...ninguna, editar: true, esCambio: true, solicitarBaja: !operacion };
  }
  return ninguna;
}

export function motivoSoloLectura(estado: EstadoPublicacion, operacion: OperacionPendiente): string {
  if (estado === 'en_revision') return 'La publicación está en revisión del Director; no puede editarse hasta que sea decidida.';
  if (estado === 'publicada' && operacion === 'baja') return 'Hay una solicitud de baja pendiente de revisión.';
  if (estado === 'descartada') return 'La publicación fue descartada y ya no admite cambios.';
  if (estado === 'despublicada') return 'La publicación fue dada de baja y ya no admite cambios.';
  return '';
}
