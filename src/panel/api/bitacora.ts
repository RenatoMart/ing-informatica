import { apiPanel } from '../../lib/api';
import type { Paginado } from '../modelos/comunes';
import type { EntradaBitacora, FiltrosBitacora } from '../modelos/usuarios';

export const bitacoraApi = {
  listar: (f: FiltrosBitacora) => apiPanel.get<Paginado<EntradaBitacora>>('/bitacora', { params: { ...f } }),
};
