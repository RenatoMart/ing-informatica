/** Tipos del dashboard y de las estadísticas de visitas (§6.3, §5.2). */

export interface DashboardEditor {
  pendientes_revision: {
    publicacion: number;
    docente: number;
    plan: number;
    documento: number;
    campana: number;
  };
  mis_observados: number;
  consultas: { recibidas: number; en_atencion: number; vencidas: number };
  documentos_por_vencer_30d: number;
  campana_vigente: { anio: number; proceso: string; fecha_fin: string } | null;
  plan_predeterminado: { anio: number; version: string } | null;
  visitas_7d: number;
}

export interface DashboardAdmin {
  usuarios_activos: number;
  usuarios_inactivos: number;
  solicitudes_pendientes: number;
  solicitudes_autorizadas_sin_ejecutar: number;
  accesos_fallidos_7d: number;
}

export type Dashboard = Partial<DashboardEditor> & Partial<DashboardAdmin>;

export interface VisitaSeccion {
  seccion: string;
  total: number;
}
export interface VisitaDia {
  dia: string;
  seccion: string;
  total: number;
}
export interface EstadisticasVisitas {
  por_seccion: VisitaSeccion[];
  por_dia: VisitaDia[];
}

export const ETIQUETA_SECCION: Record<string, string> = {
  admision: 'Admisión',
  plan_estudios: 'Plan de estudios',
  docentes: 'Docentes',
  documentos: 'Documentos',
  contacto: 'Contacto',
  inicio: 'Inicio',
  noticias: 'Noticias',
  busqueda: 'Búsqueda',
};
