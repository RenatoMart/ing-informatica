/** Modelo de documentos oficiales y campañas de admisión (HU5, P7/P8; §5.2). */
import type { EstadoCampana, EstadoDocumento } from './comunes';

// ── Utilidades de fecha (YYYY-MM-DD, sin desfase de zona horaria) ───────────

export const soloFecha = (s: string | null | undefined) => (s ? s.slice(0, 10) : '');

export function hoyISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function formatoFecha(s: string | null | undefined): string {
  const f = soloFecha(s);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(f)) return '—';
  const [a, m, d] = f.split('-');
  return `${d}/${m}/${a}`;
}

/** Días desde hoy hasta la fecha (negativo = ya pasó). */
export function diasHasta(s: string | null | undefined): number | null {
  const f = soloFecha(s);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(f)) return null;
  const [a, m, d] = f.split('-').map(Number);
  const hoy = new Date();
  const base = Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  return Math.round((Date.UTC(a, m - 1, d) - base) / 86_400_000);
}

export const DIAS_AVISO_VENCIMIENTO = 15;

// ── Documentos ──────────────────────────────────────────────────────────────

export type TipoDocumento = 'resolucion' | 'guia' | 'politica';
export const TIPOS_DOCUMENTO: { valor: TipoDocumento; etiqueta: string }[] = [
  { valor: 'resolucion', etiqueta: 'Resolución' },
  { valor: 'guia', etiqueta: 'Guía' },
  { valor: 'politica', etiqueta: 'Política' },
];
export const ETIQUETA_TIPO_DOC: Record<string, string> = Object.fromEntries(TIPOS_DOCUMENTO.map((t) => [t.valor, t.etiqueta]));

export interface DocumentoResumen {
  id_documento: number;
  tipo: TipoDocumento;
  numero: string;
  titulo?: string | null;
  estado: EstadoDocumento;
  fecha_emision: string;
  fecha_vigencia: string;
  departamento_emisor?: string | null;
}

export interface VersionDocumento {
  id_documento: number;
  numero: string;
  titulo?: string | null;
  estado: EstadoDocumento;
  fecha_emision: string;
  fecha_vigencia: string;
}

export interface DocumentoDetalle extends DocumentoResumen {
  id_departamento_emisor: number;
  archivo_url: string | null;
  id_version_anterior: number | null;
  observaciones_revision?: string | null;
  fecha_decision?: string | null;
  anteriores: VersionDocumento[];
  posteriores: VersionDocumento[];
}

export interface FiltrosDocumentos {
  tipo?: string;
  estado?: string;
  q?: string;
  pagina?: number;
}

export interface FormDocumento {
  tipo: string;
  numero: string;
  titulo: string;
  fecha_emision: string;
  id_departamento_emisor: string;
  fecha_vigencia: string;
  id_version_anterior: string;
}

export const DOCUMENTO_VACIO: FormDocumento = {
  tipo: '',
  numero: '',
  titulo: '',
  fecha_emision: '',
  id_departamento_emisor: '',
  fecha_vigencia: '',
  id_version_anterior: '',
};

export function formDeDocumento(d: DocumentoDetalle): FormDocumento {
  return {
    tipo: d.tipo,
    numero: d.numero,
    titulo: d.titulo ?? '',
    fecha_emision: soloFecha(d.fecha_emision),
    id_departamento_emisor: String(d.id_departamento_emisor ?? ''),
    fecha_vigencia: soloFecha(d.fecha_vigencia),
    id_version_anterior: d.id_version_anterior ? String(d.id_version_anterior) : '',
  };
}

export const MAX_PDF_MB = 10;

/** `esNuevo`: el PDF es obligatorio solo al registrar. */
export function validarDocumento(f: FormDocumento, esNuevo: boolean, archivo: File | null): Record<string, string> {
  const e: Record<string, string> = {};
  if (!TIPOS_DOCUMENTO.some((t) => t.valor === f.tipo)) e.tipo = 'Seleccione el tipo de documento.';
  if (!f.numero.trim()) e.numero = 'El número es obligatorio.';
  else if (f.numero.trim().length > 50) e.numero = 'Use como máximo 50 caracteres.';
  if (f.titulo.trim().length > 200) e.titulo = 'Use como máximo 200 caracteres.';
  if (!f.fecha_emision) e.fecha_emision = 'Indique la fecha de emisión.';
  if (!f.id_departamento_emisor) e.id_departamento_emisor = 'Seleccione el departamento emisor.';
  if (!f.fecha_vigencia) e.fecha_vigencia = 'Indique la fecha de vigencia.';
  else if (f.fecha_emision && f.fecha_vigencia < f.fecha_emision) e.fecha_vigencia = 'La vigencia no puede ser anterior a la emisión.';
  else if (f.fecha_vigencia < hoyISO()) e.fecha_vigencia = 'La fecha de vigencia ya pasó: el documento no podría aprobarse.';
  if (esNuevo && !archivo) e.archivo = 'Adjunte el PDF del documento.';
  if (archivo && archivo.size > MAX_PDF_MB * 1024 * 1024) e.archivo = `El PDF no puede superar ${MAX_PDF_MB} MB.`;
  return e;
}

/** Aviso sobre la vigencia: vencido, por vencer (≤15 días) o nada. */
export function avisoVigencia(fecha: string | null | undefined): { tono: 'peligro' | 'aviso'; texto: string } | null {
  const d = diasHasta(fecha);
  if (d === null) return null;
  if (d < 0) return { tono: 'peligro', texto: `Venció hace ${-d} ${-d === 1 ? 'día' : 'días'}.` };
  if (d <= DIAS_AVISO_VENCIMIENTO) return { tono: 'aviso', texto: d === 0 ? 'Vence hoy.' : `Vence en ${d} ${d === 1 ? 'día' : 'días'}.` };
  return null;
}

export const puedeEditarDocumento = (estado: string | undefined) => estado === 'no_publicado';

// ── Campañas ────────────────────────────────────────────────────────────────

export interface CampanaResumen {
  id_campana: number;
  anio: number;
  proceso: string | null;
  estado: EstadoCampana;
  fecha_inicio: string | null;
  fecha_fin: string | null;
}

export interface Modalidad {
  id_modalidad: number;
  nombre: string;
  dirigido_a: string | null;
  vacantes: number | null;
  descripcion: string | null;
}

export interface Hito {
  id_hito: number;
  hito: string;
  fecha: string;
}

export interface CampanaDetalle extends CampanaResumen {
  url_portal: string | null;
  url_estadisticas: string | null;
  observaciones_revision?: string | null;
  fecha_decision?: string | null;
  modalidades: Modalidad[];
  cronograma: Hito[];
}

export interface DatosCampana {
  anio: number;
  proceso: string;
  fecha_inicio: string;
  fecha_fin: string;
  url_portal: string;
  url_estadisticas: string;
}
export interface DatosModalidad {
  nombre: string;
  dirigido_a: string;
  vacantes: number;
  descripcion: string;
}
export interface DatosHito {
  hito: string;
  fecha: string;
}

export interface EstadoEnlace {
  ok: boolean;
  estado_http: number | null;
}
export interface ResultadoEnlaces {
  url_portal?: EstadoEnlace;
  url_estadisticas?: EstadoEnlace;
}

export type FormCampana = { anio: string; proceso: string; fecha_inicio: string; fecha_fin: string; url_portal: string; url_estadisticas: string };

export const CAMPANA_VACIA: FormCampana = {
  anio: String(new Date().getFullYear()),
  proceso: '',
  fecha_inicio: '',
  fecha_fin: '',
  url_portal: 'https://',
  url_estadisticas: 'https://',
};

export function formDeCampana(c: CampanaDetalle): FormCampana {
  return {
    anio: String(c.anio),
    proceso: c.proceso ?? '',
    fecha_inicio: soloFecha(c.fecha_inicio),
    fecha_fin: soloFecha(c.fecha_fin),
    url_portal: c.url_portal ?? '',
    url_estadisticas: c.url_estadisticas ?? '',
  };
}

export function urlHttpsValida(s: string): boolean {
  if (!s.startsWith('https://')) return false;
  try {
    return !!new URL(s).hostname.includes('.');
  } catch {
    return false;
  }
}

export function validarCampana(f: FormCampana): Record<string, string> {
  const e: Record<string, string> = {};
  const anio = Number(f.anio);
  if (!/^\d{4}$/.test(f.anio.trim()) || anio < 2000 || anio > 2100) e.anio = 'Ingrese un año entre 2000 y 2100.';
  if (!f.proceso.trim()) e.proceso = 'El proceso es obligatorio (p. ej. 2026-I).';
  else if (f.proceso.trim().length > 50) e.proceso = 'Use como máximo 50 caracteres.';
  if (!f.fecha_inicio) e.fecha_inicio = 'Indique la fecha de inicio.';
  if (!f.fecha_fin) e.fecha_fin = 'Indique la fecha de fin.';
  if (f.fecha_inicio && f.fecha_fin && f.fecha_inicio > f.fecha_fin) e.fecha_fin = 'La fecha de fin no puede ser anterior al inicio.';
  if (!urlHttpsValida(f.url_portal.trim())) e.url_portal = 'Ingrese una URL válida que empiece por https://';
  if (!urlHttpsValida(f.url_estadisticas.trim())) e.url_estadisticas = 'Ingrese una URL válida que empiece por https://';
  return e;
}

export function validarModalidad(f: { nombre: string; dirigido_a: string; vacantes: string; descripcion: string }): Record<string, string> {
  const e: Record<string, string> = {};
  if (!f.nombre.trim()) e.nombre = 'El nombre es obligatorio.';
  else if (f.nombre.trim().length > 100) e.nombre = 'Use como máximo 100 caracteres.';
  if (f.dirigido_a.trim().length > 150) e.dirigido_a = 'Use como máximo 150 caracteres.';
  const v = Number(f.vacantes);
  if (!/^\d+$/.test(f.vacantes.trim()) || v <= 0) e.vacantes = 'Las vacantes deben ser un entero mayor que 0.';
  return e;
}

export function validarHito(f: { hito: string; fecha: string }, inicio: string, fin: string): Record<string, string> {
  const e: Record<string, string> = {};
  if (!f.hito.trim()) e.hito = 'El nombre del hito es obligatorio.';
  else if (f.hito.trim().length > 150) e.hito = 'Use como máximo 150 caracteres.';
  if (!f.fecha) e.fecha = 'Indique la fecha.';
  else if (inicio && fin && (f.fecha < inicio || f.fecha > fin)) e.fecha = `La fecha debe estar entre ${formatoFecha(inicio)} y ${formatoFecha(fin)}.`;
  return e;
}

export const puedeEditarCampana = (estado: string | undefined) => estado === 'borrador';
