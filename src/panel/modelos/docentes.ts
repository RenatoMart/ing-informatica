/**
 * Modelo de Docentes y Departamentos (HU3, P3): tipos del contrato §5.2,
 * reglas del cliente (replican las del dominio) y permisos por estado.
 */
import type { EstadoDocente, OperacionPendiente } from './comunes';

export type CondicionLaboral = 'nombrado' | 'contratado';

export const CONDICIONES: { valor: CondicionLaboral; etiqueta: string }[] = [
  { valor: 'nombrado', etiqueta: 'Nombrado' },
  { valor: 'contratado', etiqueta: 'Contratado' },
];

export const ETIQUETA_CONDICION: Record<string, string> = { nombrado: 'Nombrado', contratado: 'Contratado' };

export const ESTADOS_DOCENTE: EstadoDocente[] = ['borrador', 'en_revision', 'publicado', 'inactivo'];

export const GRADOS_SUGERIDOS = ['Bachiller', 'Ingeniero', 'Licenciado', 'Magíster', 'Doctor'];
export const CATEGORIAS_RENACYT_SUGERIDAS = ['Carlos Monge Medrano', 'María Rostworowski Diez Canseco', 'Investigador RENACYT'];

export const LIMITES_DOCENTE = {
  textoMax: 150,
  especialidadesMin: 1,
  especialidadesMax: 5,
  fotoMB: 5,
  fotoMin: 300,
  encuadreDefecto: { x: 50, y: 25 },
} as const;

export const FORMATOS_FOTO = 'image/jpeg,image/png,image/webp';

export interface Departamento {
  id_departamento: number;
  nombre: string;
  correo: string | null;
}

export interface DatosDepartamento {
  nombre: string;
  correo: string | null;
}

export interface FilaDocente {
  id_docente: number;
  nombres: string;
  apellidos: string;
  grado_academico: string | null;
  id_departamento?: number | null;
  departamento: string | null;
  curso_principal: string | null;
  condicion_laboral: CondicionLaboral | null;
  es_investigador: boolean;
  categoria_renacyt: string | null;
  estado: EstadoDocente;
  operacion_pendiente: OperacionPendiente;
  foto_url: string | null;
  encuadre_x?: number | null;
  encuadre_y?: number | null;
}

/** Las especialidades pueden llegar como texto o como `{ nombre }`. */
export type EspecialidadApi = string | { nombre?: string; especialidad?: string };

export interface CambiosDocente {
  nombres?: string;
  apellidos?: string;
  grado_academico?: string | null;
  id_departamento?: number | null;
  curso_principal?: string | null;
  condicion_laboral?: CondicionLaboral | null;
  es_investigador?: boolean;
  categoria_renacyt?: string | null;
  especialidades?: EspecialidadApi[];
  encuadre_x?: number;
  encuadre_y?: number;
  [clave: string]: unknown;
}

export interface DetalleDocente extends Omit<FilaDocente, 'encuadre_x' | 'encuadre_y'> {
  especialidades: EspecialidadApi[];
  encuadre_x: number | null;
  encuadre_y: number | null;
  cambios_pendientes: CambiosDocente | null;
  observaciones_revision: string | null;
  fecha_decision?: string | null;
}

export interface FiltrosDocentes {
  estado: string;
  id_departamento: string;
  q: string;
  pagina: number;
}

/** Cuerpo de POST/PUT `/docentes`. */
export interface DatosDocente {
  nombres: string;
  apellidos: string;
  grado_academico: string;
  id_departamento: number;
  curso_principal: string;
  condicion_laboral: CondicionLaboral;
  es_investigador: boolean;
  categoria_renacyt: string | null;
  especialidades: string[];
}

export interface FormDocente {
  nombres: string;
  apellidos: string;
  grado: string;
  id_departamento: string;
  curso: string;
  condicion: CondicionLaboral | '';
  esInvestigador: boolean;
  renacyt: string;
  especialidades: string[];
  encuadreX: number;
  encuadreY: number;
}

export const FORM_DOCENTE_VACIO: FormDocente = {
  nombres: '',
  apellidos: '',
  grado: '',
  id_departamento: '',
  curso: '',
  condicion: '',
  esInvestigador: false,
  renacyt: '',
  especialidades: [],
  encuadreX: LIMITES_DOCENTE.encuadreDefecto.x,
  encuadreY: LIMITES_DOCENTE.encuadreDefecto.y,
};

export function nombreEspecialidad(e: EspecialidadApi): string {
  return typeof e === 'string' ? e : (e.nombre ?? e.especialidad ?? '');
}

export const nombreCompleto = (d: { nombres: string; apellidos: string }) => `${d.nombres} ${d.apellidos}`.trim();

const limitar = (n: unknown, def: number) =>
  typeof n === 'number' && Number.isFinite(n) ? Math.min(100, Math.max(0, Math.round(n))) : def;

/** Formulario inicial: la propuesta de cambio pendiente prevalece sobre lo publicado. */
export function formDesdeDetalle(d: DetalleDocente): FormDocente {
  const c = d.operacion_pendiente === 'cambio' ? d.cambios_pendientes : null;
  const esp = (c?.especialidades ?? d.especialidades ?? []).map(nombreEspecialidad).filter(Boolean);
  const idDep = c?.id_departamento ?? d.id_departamento;
  const investigador = c?.es_investigador ?? d.es_investigador;
  return {
    nombres: c?.nombres ?? d.nombres,
    apellidos: c?.apellidos ?? d.apellidos,
    grado: c?.grado_academico ?? d.grado_academico ?? '',
    id_departamento: idDep != null ? String(idDep) : '',
    curso: c?.curso_principal ?? d.curso_principal ?? '',
    condicion: c?.condicion_laboral ?? d.condicion_laboral ?? '',
    esInvestigador: !!investigador,
    renacyt: (c?.categoria_renacyt !== undefined ? c.categoria_renacyt : d.categoria_renacyt) ?? '',
    especialidades: esp,
    encuadreX: limitar(c?.encuadre_x ?? d.encuadre_x, LIMITES_DOCENTE.encuadreDefecto.x),
    encuadreY: limitar(c?.encuadre_y ?? d.encuadre_y, LIMITES_DOCENTE.encuadreDefecto.y),
  };
}

export function datosDesdeForm(f: FormDocente): DatosDocente {
  return {
    nombres: f.nombres.trim(),
    apellidos: f.apellidos.trim(),
    grado_academico: f.grado.trim(),
    id_departamento: Number(f.id_departamento),
    curso_principal: f.curso.trim(),
    condicion_laboral: (f.condicion || 'nombrado') as CondicionLaboral,
    es_investigador: f.esInvestigador,
    categoria_renacyt: f.esInvestigador ? f.renacyt.trim() || null : null,
    especialidades: f.especialidades.map((e) => e.trim()).filter(Boolean),
  };
}

const norm = (s: string) => s.trim().toLocaleLowerCase('es');

/** Valida y normaliza una especialidad nueva. Devuelve error o null. */
export function validarEspecialidad(texto: string, actuales: string[]): string | null {
  const t = texto.trim();
  if (!t) return 'Escriba la especialidad.';
  if (t.length > LIMITES_DOCENTE.textoMax) return `Máximo ${LIMITES_DOCENTE.textoMax} caracteres.`;
  if (actuales.some((e) => norm(e) === norm(t))) return 'Esa especialidad ya está en la lista.';
  if (actuales.length >= LIMITES_DOCENTE.especialidadesMax) return `Máximo ${LIMITES_DOCENTE.especialidadesMax} especialidades.`;
  return null;
}

export function validarDocente(f: FormDocente): Record<string, string> {
  const e: Record<string, string> = {};
  const max = LIMITES_DOCENTE.textoMax;
  if (!f.nombres.trim()) e.nombres = 'Los nombres son obligatorios.';
  else if (f.nombres.trim().length > max) e.nombres = `Máximo ${max} caracteres.`;
  if (!f.apellidos.trim()) e.apellidos = 'Los apellidos son obligatorios.';
  else if (f.apellidos.trim().length > max) e.apellidos = `Máximo ${max} caracteres.`;
  if (!f.grado.trim()) e.grado_academico = 'El grado académico es obligatorio.';
  if (!f.id_departamento) e.id_departamento = 'Seleccione un departamento.';
  if (!f.curso.trim()) e.curso_principal = 'El curso principal es obligatorio.';
  if (!f.condicion) e.condicion_laboral = 'Seleccione la condición laboral.';
  if (f.esInvestigador && !f.renacyt.trim()) e.categoria_renacyt = 'La categoría RENACYT es obligatoria para un investigador.';
  const n = f.especialidades.length;
  if (n < LIMITES_DOCENTE.especialidadesMin) e.especialidades = 'Agregue al menos una especialidad.';
  else if (n > LIMITES_DOCENTE.especialidadesMax) e.especialidades = `Máximo ${LIMITES_DOCENTE.especialidadesMax} especialidades.`;
  else if (new Set(f.especialidades.map(norm)).size !== n) e.especialidades = 'Las especialidades no pueden repetirse.';
  return e;
}

export function validarDepartamento(d: { nombre: string; correo: string }): Record<string, string> {
  const e: Record<string, string> = {};
  if (!d.nombre.trim()) e.nombre = 'El nombre es obligatorio.';
  else if (d.nombre.trim().length > 150) e.nombre = 'Máximo 150 caracteres.';
  if (d.correo.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.correo.trim())) e.correo = 'Ingrese un correo válido.';
  return e;
}

/** Tarjeta pública a partir de un formulario (`fotoPosicion = x% y%`, como el adaptador del sitio). */
export function posicionFoto(x: number, y: number): string {
  return `${x}% ${y}%`;
}

// ── Permisos por estado ─────────────────────────────────────────────────────

export interface AccionesDocente {
  editar: boolean;
  esCambio: boolean;
  enviarRevision: boolean;
  solicitarBaja: boolean;
  reactivar: boolean;
}

export function accionesPermitidas(estado: EstadoDocente | undefined, operacion: OperacionPendiente | undefined): AccionesDocente {
  const ninguna: AccionesDocente = { editar: false, esCambio: false, enviarRevision: false, solicitarBaja: false, reactivar: false };
  if (!estado) return { ...ninguna, editar: true };
  if (estado === 'borrador') return { ...ninguna, editar: true, enviarRevision: true };
  if (estado === 'publicado') {
    if (operacion === 'baja') return ninguna;
    return { ...ninguna, editar: true, esCambio: true, solicitarBaja: !operacion };
  }
  if (estado === 'inactivo') return { ...ninguna, reactivar: true };
  return ninguna;
}

export function motivoSoloLectura(estado: EstadoDocente, operacion: OperacionPendiente): string {
  if (estado === 'en_revision') return 'El registro está en revisión del Director; no puede editarse hasta que sea decidido.';
  if (estado === 'publicado' && operacion === 'baja') return 'Hay una solicitud de baja pendiente de revisión.';
  if (estado === 'inactivo') return 'El docente está dado de baja. Reactívelo para volver a editarlo.';
  return '';
}
