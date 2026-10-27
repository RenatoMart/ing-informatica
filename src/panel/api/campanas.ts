/** Cliente HTTP de campañas de admisión (docs/DISENO_BACKEND.md §5.2). */
import { apiPanel } from '../../lib/api';
import type { ItemValidacion } from '../modelos/comunes';
import type {
  CampanaDetalle,
  CampanaResumen,
  DatosCampana,
  DatosHito,
  DatosModalidad,
  ResultadoEnlaces,
} from '../modelos/documentosAdmision';

const desenvolver = <T>(r: unknown): T =>
  (r && typeof r === 'object' && 'data' in (r as object) ? (r as { data: T }).data : r) as T;
const idCreado = (r: unknown, clave: string) => {
  const d = desenvolver<Record<string, unknown>>(r) ?? {};
  return Number(d[clave] ?? d.id);
};

export const apiCampanas = {
  listar: async () => desenvolver<CampanaResumen[]>(await apiPanel.get('/campanas')) ?? [],
  obtener: async (id: number) => {
    const c = desenvolver<CampanaDetalle>(await apiPanel.get(`/campanas/${id}`));
    return { ...c, modalidades: c.modalidades ?? [], cronograma: c.cronograma ?? [] };
  },
  crear: async (d: DatosCampana) => idCreado(await apiPanel.post('/campanas', d), 'id_campana'),
  actualizar: (id: number, d: DatosCampana) => apiPanel.put(`/campanas/${id}`, d),
  duplicar: async (id: number) => idCreado(await apiPanel.post(`/campanas/${id}/duplicar`), 'id_campana'),
  guardarModalidad: (idCampana: number, idModalidad: number | undefined, d: DatosModalidad) =>
    idModalidad ? apiPanel.put(`/modalidades/${idModalidad}`, d) : apiPanel.post(`/campanas/${idCampana}/modalidades`, d),
  eliminarModalidad: (id: number) => apiPanel.delete(`/modalidades/${id}`),
  guardarHito: (idCampana: number, idHito: number | undefined, d: DatosHito) =>
    idHito ? apiPanel.put(`/hitos/${idHito}`, d) : apiPanel.post(`/campanas/${idCampana}/hitos`, d),
  eliminarHito: (id: number) => apiPanel.delete(`/hitos/${id}`),
  verificarEnlaces: async (id: number) => desenvolver<ResultadoEnlaces>(await apiPanel.post(`/campanas/${id}/verificar-enlaces`)),
  validacion: async (id: number) => desenvolver<ItemValidacion[]>(await apiPanel.get(`/campanas/${id}/validacion`)) ?? [],
  enviarRevision: (id: number) => apiPanel.post(`/campanas/${id}/enviar-revision`),
};
