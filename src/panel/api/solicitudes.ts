import { apiPanel } from '../../lib/api';
import type { Paginado } from '../modelos/comunes';
import type { DatosNuevaSolicitud, FiltrosSolicitudes, SolicitudFila } from '../modelos/usuarios';

export const solicitudesApi = {
  listar: (f: FiltrosSolicitudes & { por_pagina?: number }) =>
    apiPanel.get<Paginado<SolicitudFila>>('/solicitudes', { params: { ...f } }),
  registrar: (d: DatosNuevaSolicitud) => apiPanel.post<unknown>('/solicitudes', d),
  autorizar: (id: number, observacion?: string) =>
    apiPanel.post<void>(`/solicitudes/${id}/autorizar`, observacion ? { observacion } : {}),
  denegar: (id: number, observacion: string) => apiPanel.post<void>(`/solicitudes/${id}/denegar`, { observacion }),
};
