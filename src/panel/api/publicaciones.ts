/** Cliente HTTP de publicaciones (docs/DISENO_BACKEND.md §5.2). */
import { apiPanel, soloDatos } from '../../lib/api';
import type { Paginado, RespuestaDatos } from '../modelos/comunes';
import type {
  DatosPublicacion,
  DetallePublicacion,
  FiltrosPublicaciones,
  FilaPublicacion,
} from '../modelos/publicaciones';

export const POR_PAGINA_PUBLICACIONES = 15;

export const publicacionesApi = {
  listar: (f: Partial<FiltrosPublicaciones> & { por_pagina?: number }, signal?: AbortSignal) =>
    apiPanel.get<Paginado<FilaPublicacion>>('/publicaciones', {
      signal,
      params: {
        estado: f.estado,
        categoria: f.categoria,
        q: f.q,
        pagina: f.pagina ?? 1,
        por_pagina: f.por_pagina ?? POR_PAGINA_PUBLICACIONES,
      },
    }),

  detalle: (id: number, signal?: AbortSignal) =>
    soloDatos(apiPanel.get<RespuestaDatos<DetallePublicacion>>(`/publicaciones/${id}`, { signal })),

  crear: (datos: DatosPublicacion) =>
    soloDatos(apiPanel.post<RespuestaDatos<{ id_publicacion: number }>>('/publicaciones', datos)),

  actualizar: (id: number, datos: DatosPublicacion) =>
    soloDatos(
      apiPanel.put<RespuestaDatos<{ modo: 'directo' | 'cambio_pendiente' }>>(`/publicaciones/${id}`, datos),
    ),

  subirImagen: (id: number, imagen: File) =>
    soloDatos(
      apiPanel.subir<RespuestaDatos<{ id_archivo: number; url: string }>>(`/publicaciones/${id}/imagenes`, {
        imagen,
      }),
    ),

  quitarImagen: (id: number, idArchivo: number) =>
    apiPanel.delete(`/publicaciones/${id}/imagenes/${idArchivo}`),

  enviarRevision: (id: number) => apiPanel.post(`/publicaciones/${id}/enviar-revision`),
  solicitarBaja: (id: number) => apiPanel.post(`/publicaciones/${id}/solicitar-baja`),
  descartar: (id: number) => apiPanel.post(`/publicaciones/${id}/descartar`),
};
