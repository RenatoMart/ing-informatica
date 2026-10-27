/** Cliente HTTP del plan de estudios (docs/DISENO_BACKEND.md §5.2). */
import { apiPanel } from '../../lib/api';
import type { ItemValidacion } from '../modelos/comunes';
import type {
  DatosCurso,
  DatosPlan,
  PlanDetalle,
  PlanResumen,
  TipoPdfPlan,
} from '../modelos/planes';

const desenvolver = <T>(r: unknown): T =>
  (r && typeof r === 'object' && 'data' in (r as object) ? (r as { data: T }).data : r) as T;

/** Id de un recurso creado (`{data:{id}}` o `{data:{id_plan}}`). */
function idCreado(r: unknown, clave: string): number {
  const d = desenvolver<Record<string, unknown>>(r) ?? {};
  return Number(d[clave] ?? d.id);
}

export const apiPlanes = {
  listar: async () => desenvolver<PlanResumen[]>(await apiPanel.get('/planes')) ?? [],
  obtener: async (id: number | string) => {
    const p = desenvolver<PlanDetalle>(await apiPanel.get(`/planes/${id}`));
    return { ...p, cursos: p.cursos ?? [], prerrequisitos: p.prerrequisitos ?? [] } as PlanDetalle;
  },
  crear: async (d: DatosPlan) => idCreado(await apiPanel.post('/planes', d), 'id_plan'),
  actualizar: (id: number, d: DatosPlan) => apiPanel.put(`/planes/${id}`, d),
  duplicar: async (id: number, version: string) =>
    idCreado(await apiPanel.post(`/planes/${id}/duplicar`, { version }), 'id_plan'),
  subirPdf: async (id: number, tipo: TipoPdfPlan, archivo: File) =>
    desenvolver<{ url: string }>(await apiPanel.subir(`/planes/${id}/pdf/${tipo}`, { archivo })),
  validacion: async (id: number) => desenvolver<ItemValidacion[]>(await apiPanel.get(`/planes/${id}/validacion`)) ?? [],
  enviarRevision: (id: number) => apiPanel.post(`/planes/${id}/enviar-revision`),
  establecerPredeterminado: (id: number) => apiPanel.post(`/planes/${id}/predeterminado`),
  crearCurso: (idPlan: number, d: DatosCurso) => apiPanel.post(`/planes/${idPlan}/cursos`, d),
  importarCursos: async (idPlan: number, cursos: DatosCurso[]) =>
    desenvolver<{ importados: number }>(await apiPanel.post(`/planes/${idPlan}/cursos/importar`, { cursos })),
  actualizarCurso: (idCurso: number, d: DatosCurso) => apiPanel.put(`/cursos/${idCurso}`, d),
  eliminarCurso: (idCurso: number) => apiPanel.delete(`/cursos/${idCurso}`),
  establecerPrerrequisitos: (idCurso: number, ids_requeridos: number[]) =>
    apiPanel.put(`/cursos/${idCurso}/prerrequisitos`, { ids_requeridos }),
};
