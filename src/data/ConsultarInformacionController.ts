import { useEffect, useMemo, useState } from 'react';
import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query';
import { noticias as noticiasEstaticas } from '@profile/content/noticias';
import { docentes as docentesEstaticos } from '@profile/content/docentes';
import { apiPublico, esApiError, soloDatos } from '../lib/api';
import { useApiConRespaldo } from './useApiConRespaldo';
import {
  aDocente, aNoticia,
  type AdmisionApi, type DepartamentoApi, type DocenteApi, type DocenteVista, type DocumentoApi,
  type NoticiaVista, type Paginado, type PlanDetalleApi, type PlanVersionApi, type PublicacionApi,
  type ResultadoBusqueda,
} from './adaptadores';

export * from './adaptadores';
export { registrarVisita, useRegistrarVisita } from './useRegistrarVisita';

// ── Noticias ───────────────────────────────────────────────────────────────
export function useNoticias(porPagina: number) {
  const q = useInfiniteQuery({
    queryKey: ['publico', 'publicaciones', porPagina],
    queryFn: ({ pageParam }) =>
      apiPublico.get<Paginado<PublicacionApi>>('/publicaciones', { params: { pagina: pageParam as number, por_pagina: porPagina } }),
    initialPageParam: 1,
    getNextPageParam: (u) => (u.meta.pagina < u.meta.ultima_pagina ? u.meta.pagina + 1 : undefined),
    staleTime: 5 * 60_000,
    retry: 1,
  });
  const respaldo = q.isError;
  const noticias: NoticiaVista[] | undefined = respaldo
    ? (noticiasEstaticas as NoticiaVista[]).slice(0, porPagina)
    : q.data?.pages.flatMap((p) => p.data.map(aNoticia));
  return {
    noticias,
    cargando: q.isLoading,
    origen: respaldo ? ('respaldo' as const) : ('api' as const),
    hayMas: !respaldo && !!q.hasNextPage,
    cargandoMas: q.isFetchingNextPage,
    cargarMas: () => void q.fetchNextPage(),
  };
}

export function usePublicacion(id: string | undefined) {
  return useQuery({
    queryKey: ['publico', 'publicacion', id],
    queryFn: () => soloDatos(apiPublico.get<{ data: PublicacionApi }>(`/publicaciones/${id}`)),
    enabled: !!id,
    staleTime: 5 * 60_000,
    retry: (n, e) => !(esApiError(e) && e.status < 500 && e.status > 0) && n < 1,
  });
}

// ── Docentes ───────────────────────────────────────────────────────────────
export function useDocentes() {
  return useApiConRespaldo<DocenteVista[]>(
    ['docentes'],
    async () => (await soloDatos(apiPublico.get<{ data: DocenteApi[] }>('/docentes'))).map(aDocente),
    docentesEstaticos as DocenteVista[],
  );
}

export function useDepartamentos(respaldo: string[]) {
  return useApiConRespaldo<string[]>(
    ['departamentos'],
    async () => (await soloDatos(apiPublico.get<{ data: DepartamentoApi[] }>('/departamentos', { params: { con_docentes: true } }))).map((d) => d.nombre),
    respaldo,
  );
}

// ── Plan de estudios ───────────────────────────────────────────────────────
export function usePlanes() {
  return useApiConRespaldo<PlanVersionApi[] | null>(
    ['planes'],
    () => soloDatos(apiPublico.get<{ data: PlanVersionApi[] }>('/planes')),
    null,
  );
}

export function usePlan(id: number | null) {
  return useQuery({
    queryKey: ['publico', 'plan', id],
    queryFn: () => soloDatos(apiPublico.get<{ data: PlanDetalleApi }>(`/planes/${id}`)),
    enabled: id != null,
    staleTime: 5 * 60_000,
    retry: 1,
  });
}

// ── Documentos ─────────────────────────────────────────────────────────────
export function useDocumentos(tipo: string, historicos = false) {
  return useApiConRespaldo<DocumentoApi[]>(
    ['documentos', tipo, historicos],
    () => soloDatos(apiPublico.get<{ data: DocumentoApi[] }>('/documentos', { params: { tipo, historicos } })),
    [],
  );
}

// ── Admisión ───────────────────────────────────────────────────────────────
export type EstadoAdmision =
  | { estado: 'cargando' }
  | { estado: 'api'; datos: AdmisionApi }
  | { estado: 'sin-campana' }
  | { estado: 'respaldo' };

export function useAdmision(enabled = true): EstadoAdmision {
  const q = useQuery({
    queryKey: ['publico', 'admision'],
    queryFn: () => soloDatos(apiPublico.get<{ data: AdmisionApi }>('/admision')),
    enabled,
    staleTime: 5 * 60_000,
    retry: (n, e) => !(esApiError(e) && e.status === 404) && n < 1,
  });
  if (q.data) return { estado: 'api', datos: q.data };
  if (q.isError) return esApiError(q.error) && q.error.codigo === 'SIN_CAMPANA_VIGENTE' ? { estado: 'sin-campana' } : { estado: 'respaldo' };
  return q.isLoading ? { estado: 'cargando' } : { estado: 'respaldo' };
}

// ── Consultas (contacto) y búsqueda ────────────────────────────────────────
export interface NuevaConsulta {
  nombre: string;
  correo: string;
  asunto?: string;
  mensaje: string;
  sitio_web: string;
}

export function useEnviarConsulta() {
  return useMutation({
    mutationFn: (c: NuevaConsulta) => apiPublico.post<{ data: { id_consulta: number; mensaje: string } }>('/consultas', c),
  });
}

export function useBuscar(q: string) {
  const termino = q.trim();
  const [listo, setListo] = useState(termino);
  useEffect(() => {
    const t = setTimeout(() => setListo(termino), 300);
    return () => clearTimeout(t);
  }, [termino]);
  const activo = useMemo(() => listo.length >= 3, [listo]);
  return useQuery({
    queryKey: ['publico', 'buscar', listo],
    queryFn: () => soloDatos(apiPublico.get<{ data: ResultadoBusqueda[] }>('/buscar', { params: { q: listo } })),
    enabled: activo,
    staleTime: 60_000,
    retry: false,
  });
}
