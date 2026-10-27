/** Cliente HTTP de docentes (docs/DISENO_BACKEND.md §5.2). */
import { apiPanel, soloDatos } from '../../lib/api';
import type { Paginado, RespuestaDatos } from '../modelos/comunes';
import type { DatosDocente, DetalleDocente, FilaDocente, FiltrosDocentes } from '../modelos/docentes';

export const POR_PAGINA_DOCENTES = 15;

export const docentesApi = {
  listar: (f: FiltrosDocentes, signal?: AbortSignal) =>
    apiPanel.get<Paginado<FilaDocente>>('/docentes', {
      signal,
      params: {
        estado: f.estado,
        id_departamento: f.id_departamento,
        q: f.q,
        pagina: f.pagina,
        por_pagina: POR_PAGINA_DOCENTES,
      },
    }),

  detalle: (id: number, signal?: AbortSignal) =>
    soloDatos(apiPanel.get<RespuestaDatos<DetalleDocente>>(`/docentes/${id}`, { signal })),

  crear: (datos: DatosDocente) => soloDatos(apiPanel.post<RespuestaDatos<{ id_docente: number }>>('/docentes', datos)),

  actualizar: (id: number, datos: DatosDocente) =>
    soloDatos(apiPanel.put<RespuestaDatos<{ modo: 'directo' | 'cambio_pendiente' }>>(`/docentes/${id}`, datos)),

  /** Foto + encuadre (multipart). */
  subirFoto: (id: number, foto: File, encuadreX: number, encuadreY: number) =>
    soloDatos(
      apiPanel.subir<RespuestaDatos<{ foto_url: string }>>(`/docentes/${id}/foto`, {
        foto,
        encuadre_x: encuadreX,
        encuadre_y: encuadreY,
      }),
    ),

  encuadre: (id: number, encuadreX: number, encuadreY: number) =>
    apiPanel.patch(`/docentes/${id}/encuadre`, { encuadre_x: encuadreX, encuadre_y: encuadreY }),

  enviarRevision: (id: number) => apiPanel.post(`/docentes/${id}/enviar-revision`),
  solicitarBaja: (id: number) => apiPanel.post(`/docentes/${id}/solicitar-baja`),
  reactivar: (id: number) => apiPanel.post(`/docentes/${id}/reactivar`),
};
