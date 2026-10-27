import { apiPanel } from '../../lib/api';
import type { RespuestaDatos } from '../modelos/comunes';
import type { EstadisticasVisitas } from '../modelos/dashboard';

export const estadisticasApi = {
  visitas: async (desde: string, hasta: string): Promise<EstadisticasVisitas> => {
    const r = await apiPanel.get<RespuestaDatos<EstadisticasVisitas>>('/estadisticas/visitas', { params: { desde, hasta } });
    return { por_seccion: r.data?.por_seccion ?? [], por_dia: r.data?.por_dia ?? [] };
  },
};
