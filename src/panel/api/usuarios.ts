import { apiPanel } from '../../lib/api';
import type { Paginado, RespuestaDatos } from '../modelos/comunes';
import type {
  DatosCrearUsuario,
  DatosEditarUsuario,
  FiltrosUsuarios,
  RolInfo,
  UsuarioDetalle,
  UsuarioFila,
} from '../modelos/usuarios';

export const usuariosApi = {
  roles: async (): Promise<RolInfo[]> => {
    const r = await apiPanel.get<RespuestaDatos<RolInfo[]> | RolInfo[]>('/roles');
    return Array.isArray(r) ? r : (r?.data ?? []);
  },
  listar: (f: FiltrosUsuarios) =>
    apiPanel.get<Paginado<UsuarioFila>>('/usuarios', { params: { ...f } }),
  detalle: async (id: number) => (await apiPanel.get<RespuestaDatos<UsuarioDetalle>>(`/usuarios/${id}`)).data,
  crear: (d: DatosCrearUsuario) => apiPanel.post<RespuestaDatos<{ id_usuario: number }>>('/usuarios', d),
  editar: (id: number, d: DatosEditarUsuario) => apiPanel.patch<void>(`/usuarios/${id}`, d),
  cambiarRol: (id: number, id_solicitud: number) =>
    apiPanel.post<void>(`/usuarios/${id}/cambiar-rol`, { id_solicitud }),
  desactivar: (id: number, id_solicitud: number) =>
    apiPanel.post<void>(`/usuarios/${id}/desactivar`, { id_solicitud }),
};
