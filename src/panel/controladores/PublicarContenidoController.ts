/**
 * Controlador (MVC, Sprint 3) de Publicaciones (HU2): hooks TanStack Query
 * y acciones sobre `/api/panel/publicaciones`. Las vistas solo renderizan.
 */
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { esApiError } from '../../lib/api';
import { publicacionesApi } from '../api/publicaciones';
import { CLAVE_PENDIENTES_REVISION } from '../layout/rutasPanel';
import { useToast } from '../componentes/Toast';
import type { DatosPublicacion, FiltrosPublicaciones } from '../modelos/publicaciones';

export const CLAVES_PUBLICACIONES = {
  todo: ['panel', 'publicaciones'] as const,
  lista: (f: Partial<FiltrosPublicaciones>) => ['panel', 'publicaciones', 'lista', f] as const,
  detalle: (id: number) => ['panel', 'publicaciones', 'detalle', id] as const,
  categorias: ['panel', 'publicaciones', 'categorias'] as const,
};

/** `:id` de la ruta → número, o `undefined` si es `nueva` (o inválido). */
export function idDeRuta(param: string | undefined): number | undefined {
  if (!param || param === 'nueva') return undefined;
  const n = Number(param);
  return Number.isInteger(n) && n > 0 ? n : undefined;
}

export function usePublicaciones(filtros: FiltrosPublicaciones) {
  return useQuery({
    queryKey: CLAVES_PUBLICACIONES.lista(filtros),
    queryFn: ({ signal }) => publicacionesApi.listar(filtros, signal),
    placeholderData: keepPreviousData,
  });
}

export function usePublicacion(id: number | undefined) {
  return useQuery({
    queryKey: CLAVES_PUBLICACIONES.detalle(id ?? 0),
    queryFn: ({ signal }) => publicacionesApi.detalle(id as number, signal),
    enabled: id !== undefined,
    retry: (n, e) => !(esApiError(e) && e.status < 500 && e.status !== 0) && n < 2,
  });
}

/** Categorías ya usadas (para el `datalist` y el filtro), derivadas del listado. */
export function useCategoriasPublicacion() {
  return useQuery({
    queryKey: CLAVES_PUBLICACIONES.categorias,
    queryFn: async ({ signal }) => {
      const r = await publicacionesApi.listar({ por_pagina: 100 }, signal);
      const set = new Set<string>();
      for (const p of r.data) if (p.categoria?.trim()) set.add(p.categoria.trim());
      return [...set].sort((a, b) => a.localeCompare(b, 'es'));
    },
    staleTime: 60_000,
  });
}

function useRefrescar() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: CLAVES_PUBLICACIONES.todo });
    void qc.invalidateQueries({ queryKey: ['panel', 'revision'] });
    void qc.invalidateQueries({ queryKey: CLAVE_PENDIENTES_REVISION });
  };
}

export interface ResultadoGuardado {
  id: number;
  creada: boolean;
  modo?: 'directo' | 'cambio_pendiente';
  /** Error al subir la imagen tras crear (la publicación sí se creó). */
  errorImagen?: unknown;
}

/** Crea (sin `id`) o actualiza. Al crear, sube la imagen pendiente si la hay. */
export function useGuardarPublicacion() {
  const refrescar = useRefrescar();
  const toast = useToast();
  return useMutation({
    mutationFn: async (p: { id?: number; datos: DatosPublicacion; imagen?: File | null }): Promise<ResultadoGuardado> => {
      if (p.id === undefined) {
        const r = await publicacionesApi.crear(p.datos);
        let errorImagen: unknown;
        if (p.imagen) {
          try {
            await publicacionesApi.subirImagen(r.id_publicacion, p.imagen);
          } catch (e) {
            errorImagen = e;
          }
        }
        return { id: r.id_publicacion, creada: true, errorImagen };
      }
      const r = await publicacionesApi.actualizar(p.id, p.datos);
      return { id: p.id, creada: false, modo: r.modo };
    },
    onSuccess: (r) => {
      refrescar();
      if (r.creada) toast.exito('Borrador creado.');
      else if (r.modo === 'cambio_pendiente')
        toast.exito('Cambios guardados como propuesta; se aplicarán cuando el Director los apruebe.');
      else toast.exito('Borrador guardado.');
    },
    onError: (e) => {
      if (!(esApiError(e) && e.esValidacion)) toast.error(e);
    },
  });
}

export function useSubirImagenPublicacion(id: number | undefined) {
  const refrescar = useRefrescar();
  const toast = useToast();
  return useMutation({
    mutationFn: (imagen: File) => publicacionesApi.subirImagen(id as number, imagen),
    onSuccess: () => {
      refrescar();
      toast.exito('Imagen agregada.');
    },
    onError: (e) => {
      if (!(esApiError(e) && e.esValidacion)) toast.error(e);
    },
  });
}

export function useQuitarImagenPublicacion(id: number | undefined) {
  const refrescar = useRefrescar();
  const toast = useToast();
  return useMutation({
    mutationFn: (idArchivo: number) => publicacionesApi.quitarImagen(id as number, idArchivo),
    onSuccess: () => {
      refrescar();
      toast.exito('Imagen quitada.');
    },
    onError: (e) => toast.error(e),
  });
}

export type AccionPublicacion = 'enviar-revision' | 'solicitar-baja' | 'descartar';

const MENSAJES_ACCION: Record<AccionPublicacion, string> = {
  'enviar-revision': 'Publicación enviada a revisión.',
  'solicitar-baja': 'Baja solicitada; el Director debe aprobarla.',
  descartar: 'Publicación descartada.',
};

/** Acciones de estado sobre una publicación (enviar a revisión, baja, descarte). */
export function useAccionPublicacion() {
  const refrescar = useRefrescar();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ id, accion }: { id: number; accion: AccionPublicacion }) =>
      accion === 'enviar-revision'
        ? publicacionesApi.enviarRevision(id)
        : accion === 'solicitar-baja'
          ? publicacionesApi.solicitarBaja(id)
          : publicacionesApi.descartar(id),
    onSuccess: (_r, v) => {
      refrescar();
      toast.exito(MENSAJES_ACCION[v.accion]);
    },
    onError: (e) => {
      if (!(esApiError(e) && e.esValidacion)) toast.error(e);
    },
  });
}
