import { apiPanel } from '../../lib/api';
import type { EntidadRevisable, RespuestaDatos } from '../modelos/comunes';
import { RUTA_DETALLE, type DatosDecidir, type DetalleRegistro } from '../modelos/revision';

export const revisionApi = {
  /** `POST /revision/{entidad}/{id}/decidir` → `{data:{estado}}`. */
  decidir: ({ entidad, id, ...cuerpo }: DatosDecidir) =>
    apiPanel.post<RespuestaDatos<{ estado: string }>>(`/revision/${entidad}/${id}/decidir`, cuerpo),
  /** Detalle del registro en revisión (endpoint del módulo). */
  detalle: async (entidad: EntidadRevisable, id: number): Promise<DetalleRegistro> => {
    const r = await apiPanel.get<RespuestaDatos<DetalleRegistro> | DetalleRegistro>(`${RUTA_DETALLE[entidad]}/${id}`);
    return r && typeof r === 'object' && 'data' in r && typeof r.data === 'object' ? (r.data as DetalleRegistro) : (r as DetalleRegistro);
  },
};
