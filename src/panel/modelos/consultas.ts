/** Tipos de la atención de consultas de contacto (HU6, §5.2). */
import type { EstadoConsulta } from './comunes';

export interface ConsultaFila {
  id_consulta: number;
  nombre: string;
  correo: string;
  asunto: string;
  estado: EstadoConsulta | string;
  fecha_recepcion: string;
  dias_habiles: number;
  vencida: boolean;
}

export interface ConsultaDetalle extends ConsultaFila {
  mensaje: string;
  fecha_clasificacion?: string | null;
  fecha_respuesta?: string | null;
  respuesta?: string | null;
  id_departamento_responsable?: number | null;
  departamento?: string | null;
}

export type DestinoClasificacion = 'area' | 'externa' | 'descartar';

export interface DatosClasificar {
  destino: DestinoClasificacion;
  id_departamento?: number;
  nota?: string;
}

export interface Departamento {
  id_departamento: number;
  nombre: string;
  correo?: string | null;
}

export interface FiltrosConsultas {
  pagina?: number;
  por_pagina?: number;
  estado?: string;
  vencidas?: boolean;
  q?: string;
}
