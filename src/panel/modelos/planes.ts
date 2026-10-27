/**
 * Modelo del plan de estudios (HU4, P6): tipos del contrato §5.2, validaciones
 * del cliente (§6.3) y utilidades puras (detección de ciclos, malla, importación).
 */
import type { Edge } from 'reactflow';
import type { AreaType, CourseData } from '@profile/content/malla';
import type { EstadoPlan } from './comunes';

export type TipoCurso = 'obligatorio' | 'electivo';
export type AreaFormacion = AreaType;
export type TipoPdfPlan = 'plan' | 'resolucion';

export const TIPOS_CURSO: { valor: TipoCurso; etiqueta: string }[] = [
  { valor: 'obligatorio', etiqueta: 'Obligatorio' },
  { valor: 'electivo', etiqueta: 'Electivo' },
];

export const AREAS_FORMACION: { valor: AreaFormacion; etiqueta: string }[] = [
  { valor: 'general', etiqueta: 'Estudios generales' },
  { valor: 'especifico', etiqueta: 'Estudios específicos' },
  { valor: 'especialidad', etiqueta: 'Estudios de especialidad' },
];

export const ETIQUETA_AREA: Record<string, string> = Object.fromEntries(
  AREAS_FORMACION.map((a) => [a.valor, a.etiqueta]),
);

/** `GET /planes` → elemento. */
export interface PlanResumen {
  id_plan: number;
  anio: number;
  version: string;
  estado: EstadoPlan;
  es_predeterminada: boolean;
  total_cursos: number;
  total_creditos: number;
}

export interface Curso {
  id_curso: number;
  codigo: string;
  nombre: string;
  creditos: number;
  tipo: TipoCurso;
  ciclo: number;
  area_formacion: AreaFormacion | string | null;
  horas_teoria: number;
  horas_practica: number;
  descripcion: string | null;
}

export interface Prerrequisito {
  id_curso: number;
  id_curso_requerido: number;
}

/** `GET /planes/{id}` → data. */
export interface PlanDetalle {
  id_plan: number;
  anio: number;
  version: string;
  estado: EstadoPlan;
  es_predeterminada: boolean;
  observaciones_revision?: string | null;
  fecha_decision?: string | null;
  cursos: Curso[];
  prerrequisitos: Prerrequisito[];
  pdf_plan_url: string | null;
  pdf_resolucion_url: string | null;
}

export interface DatosPlan {
  anio: number;
  version: string;
}

export interface DatosCurso {
  codigo: string;
  nombre: string;
  creditos: number;
  tipo: TipoCurso;
  ciclo: number;
  area_formacion: string;
  horas_teoria: number;
  horas_practica: number;
  descripcion?: string;
}

/** Estado del formulario de curso (todo texto, se convierte al enviar). */
export interface FormCurso {
  codigo: string;
  nombre: string;
  creditos: string;
  tipo: TipoCurso;
  ciclo: string;
  area_formacion: string;
  horas_teoria: string;
  horas_practica: string;
  descripcion: string;
}

export const CURSO_VACIO: FormCurso = {
  codigo: '',
  nombre: '',
  creditos: '3',
  tipo: 'obligatorio',
  ciclo: '1',
  area_formacion: 'general',
  horas_teoria: '2',
  horas_practica: '2',
  descripcion: '',
};

export function formDeCurso(c: Curso): FormCurso {
  return {
    codigo: c.codigo,
    nombre: c.nombre,
    creditos: String(c.creditos),
    tipo: c.tipo,
    ciclo: String(c.ciclo),
    area_formacion: c.area_formacion ?? 'general',
    horas_teoria: String(c.horas_teoria ?? 0),
    horas_practica: String(c.horas_practica ?? 0),
    descripcion: c.descripcion ?? '',
  };
}

/** Estados en los que el plan admite edición (el servidor responde 409 en otro caso). */
export const puedeEditarPlan = (estado: string | undefined) => estado === 'borrador';

// ── Validaciones ────────────────────────────────────────────────────────────

const entero = (s: string) => (/^-?\d+$/.test(s.trim()) ? Number(s.trim()) : NaN);

export function validarDatosPlan(f: { anio: string; version: string }): Record<string, string> {
  const e: Record<string, string> = {};
  const anio = entero(f.anio);
  if (Number.isNaN(anio) || anio < 2000 || anio > 2100) e.anio = 'Ingrese un año entre 2000 y 2100.';
  if (!f.version.trim()) e.version = 'La versión es obligatoria.';
  else if (f.version.trim().length > 20) e.version = 'Use como máximo 20 caracteres.';
  return e;
}

/** Valida un curso; `otros` son los demás cursos del plan (para la unicidad del código). */
export function validarCurso(f: FormCurso, otros: Pick<Curso, 'codigo'>[]): Record<string, string> {
  const e: Record<string, string> = {};
  const codigo = f.codigo.trim();
  if (!codigo) e.codigo = 'El código es obligatorio.';
  else if (/\s/.test(codigo)) e.codigo = 'El código no puede contener espacios.';
  else if (codigo.length > 20) e.codigo = 'Use como máximo 20 caracteres.';
  else if (otros.some((o) => o.codigo.toLowerCase() === codigo.toLowerCase()))
    e.codigo = 'Ya existe un curso con este código en el plan.';
  if (!f.nombre.trim()) e.nombre = 'El nombre es obligatorio.';
  else if (f.nombre.trim().length > 150) e.nombre = 'Use como máximo 150 caracteres.';
  const rango = (campo: keyof FormCurso, min: number, max: number, msg: string) => {
    const n = entero(String(f[campo]));
    if (Number.isNaN(n) || n < min || n > max) e[campo] = msg;
  };
  rango('creditos', 1, 10, 'Los créditos van de 1 a 10.');
  rango('ciclo', 1, 10, 'El ciclo va de 1 a 10.');
  rango('horas_teoria', 0, 10, 'Las horas van de 0 a 10.');
  rango('horas_practica', 0, 10, 'Las horas van de 0 a 10.');
  if (!AREAS_FORMACION.some((a) => a.valor === f.area_formacion)) e.area_formacion = 'Seleccione el área de formación.';
  return e;
}

export function datosDeForm(f: FormCurso): DatosCurso {
  return {
    codigo: f.codigo.trim(),
    nombre: f.nombre.trim(),
    creditos: Number(f.creditos),
    tipo: f.tipo,
    ciclo: Number(f.ciclo),
    area_formacion: f.area_formacion,
    horas_teoria: Number(f.horas_teoria),
    horas_practica: Number(f.horas_practica),
    ...(f.descripcion.trim() ? { descripcion: f.descripcion.trim() } : {}),
  };
}

// ── Ciclos y prerrequisitos ─────────────────────────────────────────────────

const ROMANOS = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
export const romano = (n: number) => ROMANOS[n] ?? String(n);

/** Mapa curso → requeridos a partir de la lista plana del contrato. */
export function mapaRequisitos(prerrequisitos: Prerrequisito[]): Map<number, number[]> {
  const m = new Map<number, number[]>();
  for (const p of prerrequisitos) m.set(p.id_curso, [...(m.get(p.id_curso) ?? []), p.id_curso_requerido]);
  return m;
}

/**
 * Detecta un prerrequisito circular (DFS iterativo con colores). Devuelve la
 * ruta de ids cerrada (`[a, b, a]`) o `null` si no hay ciclo.
 */
export function detectarCiclo(requisitos: Map<number, number[]>): number[] | null {
  const estado = new Map<number, 1 | 2>(); // 1 = en la ruta actual, 2 = terminado
  for (const inicio of requisitos.keys()) {
    if (estado.has(inicio)) continue;
    const ruta: number[] = [];
    const pila: { id: number; i: number }[] = [{ id: inicio, i: 0 }];
    estado.set(inicio, 1);
    ruta.push(inicio);
    while (pila.length) {
      const tope = pila[pila.length - 1];
      const hijos = requisitos.get(tope.id) ?? [];
      if (tope.i >= hijos.length) {
        estado.set(tope.id, 2);
        pila.pop();
        ruta.pop();
        continue;
      }
      const sig = hijos[tope.i++];
      const e = estado.get(sig);
      if (e === 1) return [...ruta.slice(ruta.indexOf(sig)), sig];
      if (e === 2) continue;
      estado.set(sig, 1);
      ruta.push(sig);
      pila.push({ id: sig, i: 0 });
    }
  }
  return null;
}

/** "A → B → A" con los códigos de los cursos. */
export function describirRuta(ruta: number[], cursos: Pick<Curso, 'id_curso' | 'codigo'>[]): string {
  const cod = new Map(cursos.map((c) => [c.id_curso, c.codigo]));
  return ruta.map((id) => cod.get(id) ?? `#${id}`).join(' → ');
}

/** Ruta del ciclo que se crearía al fijar `requeridos` como prerrequisitos de `idCurso`. */
export function cicloAlAsignar(
  prerrequisitos: Prerrequisito[],
  idCurso: number,
  requeridos: number[],
  cursos: Pick<Curso, 'id_curso' | 'codigo'>[],
): string | null {
  const resto = prerrequisitos.filter((p) => p.id_curso !== idCurso);
  const nuevos = requeridos.map((r) => ({ id_curso: idCurso, id_curso_requerido: r }));
  const ruta = detectarCiclo(mapaRequisitos([...resto, ...nuevos]));
  return ruta ? describirRuta(ruta, cursos) : null;
}

/** Resumen por ciclo: créditos y número de cursos. */
export function resumenPorCiclo(cursos: Curso[]) {
  const m = new Map<number, { ciclo: number; cursos: Curso[]; creditos: number }>();
  for (const c of cursos) {
    const g = m.get(c.ciclo) ?? { ciclo: c.ciclo, cursos: [], creditos: 0 };
    g.cursos.push(c);
    g.creditos += c.creditos;
    m.set(c.ciclo, g);
  }
  return [...m.values()].sort((a, b) => a.ciclo - b.ciclo).map((g) => ({
    ...g,
    cursos: g.cursos.sort((a, b) => a.codigo.localeCompare(b.codigo)),
  }));
}

// ── Malla (vista previa con MallaFlow) ──────────────────────────────────────

const COLOR_ARISTA: Record<string, string> = { general: '#10b981', especifico: '#f97316', especialidad: '#38bdf8' };

export function datosMalla(cursos: Curso[], prerrequisitos: Prerrequisito[]) {
  const porId = new Map(cursos.map((c) => [c.id_curso, c]));
  const datos: CourseData[] = [...cursos]
    .sort((a, b) => a.ciclo - b.ciclo || a.codigo.localeCompare(b.codigo))
    .map((c) => ({
      id: c.codigo,
      name: c.nombre,
      type: (['general', 'especifico', 'especialidad'].includes(String(c.area_formacion))
        ? c.area_formacion
        : 'general') as AreaType,
      credits: c.creditos,
      hoursT: c.horas_teoria,
      hoursP: c.horas_practica,
      cycle: `Ciclo ${romano(c.ciclo)}`,
      isElective: c.tipo === 'electivo',
      description: c.descripcion ?? '',
    }));
  const aristas: Edge[] = [];
  prerrequisitos.forEach((p, i) => {
    const req = porId.get(p.id_curso_requerido);
    const cur = porId.get(p.id_curso);
    if (!req || !cur) return;
    aristas.push({
      id: `e-${i}`,
      source: req.codigo,
      target: cur.codigo,
      style: { stroke: COLOR_ARISTA[String(cur.area_formacion)] ?? '#38bdf8', strokeWidth: 2 },
    });
  });
  const columnas: Record<string, number> = {};
  for (let n = 1; n <= 10; n++) columnas[`Ciclo ${romano(n)}`] = (n - 1) * 320;
  return { cursos: datos, aristas, columnas };
}

// ── Importación JSON/CSV (se convierte a JSON en el cliente) ────────────────

export const MAX_IMPORTAR = 120;
const CAMPOS_CSV = ['codigo', 'nombre', 'creditos', 'tipo', 'ciclo', 'area_formacion', 'horas_teoria', 'horas_practica', 'descripcion'];

function dividirCsv(linea: string, sep: string): string[] {
  const out: string[] = [];
  let actual = '';
  let comillas = false;
  for (let i = 0; i < linea.length; i++) {
    const ch = linea[i];
    if (comillas) {
      if (ch === '"' && linea[i + 1] === '"') {
        actual += '"';
        i++;
      } else if (ch === '"') comillas = false;
      else actual += ch;
    } else if (ch === '"') comillas = true;
    else if (ch === sep) {
      out.push(actual.trim());
      actual = '';
    } else actual += ch;
  }
  out.push(actual.trim());
  return out;
}

export interface ResultadoImportacion {
  cursos: DatosCurso[];
  errores: string[];
}

/** Interpreta texto JSON (arreglo u objeto `{cursos}`) o CSV con cabecera y valida cada fila. */
export function interpretarImportacion(texto: string): ResultadoImportacion {
  const t = texto.trim();
  if (!t) return { cursos: [], errores: ['No hay contenido para importar.'] };
  let filas: Record<string, unknown>[];
  try {
    if (t.startsWith('[') || t.startsWith('{')) {
      const j = JSON.parse(t) as unknown;
      const lista = Array.isArray(j) ? j : (j as { cursos?: unknown }).cursos;
      if (!Array.isArray(lista)) return { cursos: [], errores: ['El JSON debe ser un arreglo de cursos o {"cursos": [...]}.'] };
      filas = lista as Record<string, unknown>[];
    } else {
      const lineas = t.split(/\r?\n/).filter((l) => l.trim());
      const sep = lineas[0].includes(';') && !lineas[0].includes(',') ? ';' : lineas[0].includes('\t') ? '\t' : ',';
      const cab = dividirCsv(lineas[0], sep).map((c) => c.toLowerCase().replace(/\s+/g, '_'));
      const faltan = CAMPOS_CSV.slice(0, 6).filter((c) => !cab.includes(c));
      if (faltan.length) return { cursos: [], errores: [`Faltan columnas en la cabecera: ${faltan.join(', ')}.`] };
      filas = lineas.slice(1).map((l) => {
        const v = dividirCsv(l, sep);
        return Object.fromEntries(cab.map((c, i) => [c, v[i] ?? '']));
      });
    }
  } catch {
    return { cursos: [], errores: ['El contenido no es un JSON válido.'] };
  }
  const errores: string[] = [];
  if (!filas.length) errores.push('No hay filas para importar.');
  if (filas.length > MAX_IMPORTAR) errores.push(`Se pueden importar como máximo ${MAX_IMPORTAR} cursos.`);
  const cursos: DatosCurso[] = [];
  const vistos: Pick<Curso, 'codigo'>[] = [];
  filas.forEach((f, i) => {
    const form: FormCurso = {
      codigo: String(f.codigo ?? ''),
      nombre: String(f.nombre ?? ''),
      creditos: String(f.creditos ?? ''),
      tipo: String(f.tipo ?? 'obligatorio').toLowerCase() === 'electivo' ? 'electivo' : 'obligatorio',
      ciclo: String(f.ciclo ?? ''),
      area_formacion: String(f.area_formacion ?? '').toLowerCase(),
      horas_teoria: String(f.horas_teoria ?? '0') || '0',
      horas_practica: String(f.horas_practica ?? '0') || '0',
      descripcion: String(f.descripcion ?? ''),
    };
    const ev = validarCurso(form, vistos);
    const msgs = Object.entries(ev);
    if (msgs.length) msgs.forEach(([campo, m]) => errores.push(`Fila ${i + 1} (${campo}): ${m}`));
    else {
      cursos.push(datosDeForm(form));
      vistos.push({ codigo: form.codigo.trim() });
    }
  });
  return { cursos, errores };
}
