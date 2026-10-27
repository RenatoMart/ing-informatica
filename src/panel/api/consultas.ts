import { apiPanel } from '../../lib/api';
import type { Paginado, RespuestaDatos } from '../modelos/comunes';
import type {
  ConsultaDetalle,
  ConsultaFila,
  DatosClasificar,
  Departamento,
  FiltrosConsultas,
} from '../modelos/consultas';

export const consultasApi = {
  listar: (f: FiltrosConsultas) => apiPanel.get<Paginado<ConsultaFila>>('/consultas', { params: { ...f } }),
  detalle: async (id: number) => (await apiPanel.get<RespuestaDatos<ConsultaDetalle>>(`/consultas/${id}`)).data,
  clasificar: (id: number, d: DatosClasificar) => apiPanel.post<void>(`/consultas/${id}/clasificar`, d),
  responder: (id: number, respuesta: string) => apiPanel.post<void>(`/consultas/${id}/responder`, { respuesta }),
  departamentos: async (): Promise<Departamento[]> => {
    const r = await apiPanel.get<RespuestaDatos<Departamento[]> | Departamento[]>('/departamentos');
    return Array.isArray(r) ? r : (r?.data ?? []);
  },
};
