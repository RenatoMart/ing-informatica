import type { Edge } from 'reactflow';
import type { CourseData } from '@profile/content/malla';
import { formatearFecha } from '../utils/formatters';

// ── Tipos de la API pública (docs/DISENO_BACKEND.md §5.3) ──────────────────
export interface Paginado<T> {
  data: T[];
  meta: { pagina: number; por_pagina: number; total: number; ultima_pagina: number };
}

export interface PublicacionApi {
  id_publicacion: number;
  titulo: string;
  resumen: string | null;
  categoria: string | null;
  fecha_visible: string;
  imagen_url: string | null;
  contenido?: string | null;
  imagenes?: Array<string | { url?: string; imagen_url?: string }>;
}

export interface DocenteApi {
  id_docente: number;
  nombres: string;
  apellidos: string;
  grado_academico: string | null;
  departamento: string | null;
  curso_principal: string | null;
  especialidades: string[] | null;
  condicion_laboral: string | null;
  es_investigador: boolean;
  categoria_renacyt: string | null;
  foto_url: string | null;
  encuadre_x: number | null;
  encuadre_y: number | null;
}

export interface DepartamentoApi {
  id_departamento: number;
  nombre: string;
}

export interface PlanVersionApi {
  id_plan: number;
  anio: number;
  version: number;
  estado: string;
  es_predeterminada: boolean;
}

export interface PlanDetalleApi {
  plan: PlanVersionApi & { pdf_plan_url: string | null; pdf_resolucion_url: string | null };
  cursos: CourseData[];
  aristas: Edge[];
  columnas: Record<string, number>;
}

export interface DocumentoApi {
  id_documento: number;
  tipo: string;
  numero: string | null;
  titulo: string;
  fecha_emision: string | null;
  fecha_vigencia: string | null;
  departamento: string | null;
  estado: string;
  archivo_url: string | null;
}

export interface AdmisionApi {
  campana: { anio: number; proceso: string; fecha_inicio: string | null; fecha_fin: string | null; url_portal: string | null; url_estadisticas: string | null };
  modalidades: Array<{ nombre: string; dirigido_a: string; vacantes: number; descripcion: string }>;
  cronograma: Array<{ hito: string; fecha: string }>;
}

export interface ResultadoBusqueda {
  tipo: 'publicacion' | 'docente' | 'curso' | 'documento';
  titulo: string;
  extracto: string;
  ruta: string;
}

// ── Formas que consumen los componentes ────────────────────────────────────
export interface NoticiaVista {
  id: number;
  categoria: string;
  categoriaColor: string;
  titulo: string;
  resumen: string;
  fecha: string;
  fechaFormateada: string;
  link: string;
  imagen: string;
}

export interface DocenteVista {
  nombre: string;
  grado: string;
  departamento: string;
  cursoPrincipal: string;
  especialidades: string[];
  foto: string | null;
  fotoPosicion?: string;
  investigador: boolean;
  categoriaInvestigacion?: string | null;
  condicion?: string | null;
}

const CLASES_CATEGORIA = ['bg-primary text-white', 'bg-gold text-ink', 'bg-[#12377B] text-white'];

export function claseCategoria(categoria: string): string {
  let h = 0;
  for (let i = 0; i < categoria.length; i++) h = (h * 31 + categoria.charCodeAt(i)) >>> 0;
  return CLASES_CATEGORIA[h % CLASES_CATEGORIA.length];
}

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

/** "2025-01-15" → "15 Ene 2025" (sin desfase de zona horaria). */
export function fechaCorta(fecha: string | null | undefined): string {
  if (!fecha) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(fecha);
  if (!m) return formatearFecha(fecha);
  return `${m[3]} ${MESES[Number(m[2]) - 1] ?? m[2]} ${m[1]}`;
}

export function aNoticia(p: PublicacionApi): NoticiaVista {
  const categoria = p.categoria ?? 'Noticias';
  return {
    id: p.id_publicacion,
    categoria,
    categoriaColor: claseCategoria(categoria),
    titulo: p.titulo,
    resumen: p.resumen ?? '',
    fecha: p.fecha_visible,
    fechaFormateada: fechaCorta(p.fecha_visible),
    link: `/noticias/${p.id_publicacion}`,
    imagen: p.imagen_url ?? '',
  };
}

export function aDocente(d: DocenteApi): DocenteVista {
  const cond = d.condicion_laboral ? d.condicion_laboral.charAt(0).toUpperCase() + d.condicion_laboral.slice(1).toLowerCase() : null;
  return {
    nombre: `${d.nombres} ${d.apellidos}`.trim(),
    grado: d.grado_academico ?? '',
    departamento: d.departamento ?? '',
    cursoPrincipal: d.curso_principal ?? '',
    especialidades: d.especialidades ?? [],
    foto: d.foto_url,
    fotoPosicion: d.foto_url && d.encuadre_x != null && d.encuadre_y != null ? `${d.encuadre_x}% ${d.encuadre_y}%` : undefined,
    investigador: !!d.es_investigador,
    categoriaInvestigacion: d.categoria_renacyt,
    condicion: cond,
  };
}

/** Etiqueta del selector: el año, o "año vN" si hay varias versiones del mismo año. */
export function etiquetaPlan(p: PlanVersionApi, todos: PlanVersionApi[]): string {
  const repetido = todos.filter((x) => x.anio === p.anio).length > 1;
  return repetido ? `${p.anio} v${p.version}` : String(p.anio);
}
