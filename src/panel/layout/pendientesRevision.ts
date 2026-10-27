import { queryOptions } from '@tanstack/react-query';
import { apiPanel } from '../../lib/api';
import type { PendienteRevision, RespuestaDatos } from '../modelos/comunes';
import { CLAVE_PENDIENTES_REVISION } from './rutasPanel';

/**
 * Consulta compartida de `GET /api/panel/revision/pendientes` (contador del
 * menú y bandeja de revisión). Úsela con `useQuery(consultaPendientesRevision)`
 * e invalide `CLAVE_PENDIENTES_REVISION` tras decidir o enviar a revisión.
 */
export const consultaPendientesRevision = queryOptions({
  queryKey: CLAVE_PENDIENTES_REVISION,
  queryFn: async (): Promise<PendienteRevision[]> => {
    const r = await apiPanel.get<RespuestaDatos<PendienteRevision[]> | PendienteRevision[]>('/revision/pendientes');
    return Array.isArray(r) ? r : (r?.data ?? []);
  },
  staleTime: 30_000,
});
