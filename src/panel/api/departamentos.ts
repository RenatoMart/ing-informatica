/** Cliente HTTP de departamentos (docs/DISENO_BACKEND.md §5.2). */
import { apiPanel, soloDatos } from '../../lib/api';
import type { RespuestaDatos } from '../modelos/comunes';
import type { DatosDepartamento, Departamento } from '../modelos/docentes';

export const departamentosApi = {
  listar: (signal?: AbortSignal) =>
    apiPanel.get<RespuestaDatos<Departamento[]> | Departamento[]>('/departamentos', { signal }).then((r) => (Array.isArray(r) ? r : r.data)),

  crear: (datos: DatosDepartamento) =>
    soloDatos(apiPanel.post<RespuestaDatos<{ id_departamento: number }>>('/departamentos', datos)),

  actualizar: (id: number, datos: DatosDepartamento) => apiPanel.put(`/departamentos/${id}`, datos),
};
