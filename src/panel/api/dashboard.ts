import { apiPanel } from '../../lib/api';
import type { RespuestaDatos } from '../modelos/comunes';
import type { Dashboard } from '../modelos/dashboard';

export const dashboardApi = {
  obtener: async (): Promise<Dashboard> => (await apiPanel.get<RespuestaDatos<Dashboard>>('/dashboard')).data ?? {},
};
