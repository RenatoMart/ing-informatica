/**
 * Controlador (MVC, Sprint 3) de HU5 «Documentos oficiales y admisión»:
 * hooks de TanStack Query sobre `/documentos`, `/campanas`, `/modalidades` y `/hitos`.
 */
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiCampanas } from '../api/campanas';
import { apiDocumentos, type DatosDocumentoEnvio } from '../api/documentos';
import { CLAVE_PENDIENTES_REVISION } from '../layout/rutasPanel';
import type { DatosCampana, DatosHito, DatosModalidad, FiltrosDocumentos } from '../modelos/documentosAdmision';

export const CLAVES_DOC = {
  lista: ['panel', 'documentos'] as const,
  detalle: (id: number | undefined) => ['panel', 'documentos', 'detalle', id] as const,
  departamentos: ['panel', 'departamentos', 'documentos'] as const,
};
export const CLAVES_CAMPANA = {
  lista: ['panel', 'campanas'] as const,
  detalle: (id: number | undefined) => ['panel', 'campanas', 'detalle', id] as const,
  validacion: (id: number | undefined) => ['panel', 'campanas', 'validacion', id] as const,
};

// ── Documentos ──────────────────────────────────────────────────────────────

export function useDocumentos(filtros: FiltrosDocumentos) {
  return useQuery({
    queryKey: [...CLAVES_DOC.lista, 'lista', filtros],
    queryFn: () => apiDocumentos.listar({ ...filtros, por_pagina: 20 }),
    placeholderData: keepPreviousData,
  });
}

export function useDocumento(id: number | undefined) {
  return useQuery({
    queryKey: CLAVES_DOC.detalle(id),
    queryFn: () => apiDocumentos.obtener(id as number),
    enabled: id !== undefined,
  });
}

export function useDepartamentosDocumento() {
  return useQuery({ queryKey: CLAVES_DOC.departamentos, queryFn: apiDocumentos.departamentos, staleTime: 5 * 60_000 });
}

/** Documentos vigentes o vencidos del mismo tipo que pueden ser reemplazados. */
export function useDocumentosReemplazables(tipo: string, habilitado: boolean) {
  return useQuery({
    queryKey: [...CLAVES_DOC.lista, 'reemplazables', tipo],
    enabled: habilitado && !!tipo,
    queryFn: async () => {
      const [v, x] = await Promise.all([
        apiDocumentos.listar({ tipo, estado: 'vigente', por_pagina: 100 }),
        apiDocumentos.listar({ tipo, estado: 'vencido', por_pagina: 100 }),
      ]);
      return [...v.data, ...x.data].filter((d) => d.tipo === tipo);
    },
  });
}

function useRefrescarDocumentos() {
  const qc = useQueryClient();
  return (id?: number) => {
    void qc.invalidateQueries({ queryKey: CLAVES_DOC.lista });
    if (id !== undefined) void qc.invalidateQueries({ queryKey: ['panel', 'revision', 'historial', 'documento', String(id)] });
    void qc.invalidateQueries({ queryKey: CLAVE_PENDIENTES_REVISION });
  };
}

export function useRegistrarDocumento() {
  const refrescar = useRefrescarDocumentos();
  return useMutation({ mutationFn: (d: DatosDocumentoEnvio) => apiDocumentos.crear(d), onSuccess: () => refrescar() });
}

export function useActualizarDocumento(id: number) {
  const refrescar = useRefrescarDocumentos();
  return useMutation({ mutationFn: (d: DatosDocumentoEnvio) => apiDocumentos.actualizar(id, d), onSuccess: () => refrescar(id) });
}

export function useReenviarDocumento(id: number) {
  const refrescar = useRefrescarDocumentos();
  return useMutation({ mutationFn: () => apiDocumentos.reenviar(id), onSuccess: () => refrescar(id) });
}

// ── Campañas ────────────────────────────────────────────────────────────────

export function useCampanas() {
  return useQuery({ queryKey: CLAVES_CAMPANA.lista, queryFn: apiCampanas.listar });
}

export function useCampana(id: number | undefined) {
  return useQuery({
    queryKey: CLAVES_CAMPANA.detalle(id),
    queryFn: () => apiCampanas.obtener(id as number),
    enabled: id !== undefined,
  });
}

export function useValidacionCampana(id: number | undefined) {
  return useQuery({
    queryKey: CLAVES_CAMPANA.validacion(id),
    queryFn: () => apiCampanas.validacion(id as number),
    enabled: id !== undefined,
  });
}

function useRefrescarCampanas() {
  const qc = useQueryClient();
  return (id?: number) => {
    void qc.invalidateQueries({ queryKey: CLAVES_CAMPANA.lista });
    if (id !== undefined) void qc.invalidateQueries({ queryKey: ['panel', 'revision', 'historial', 'campana', String(id)] });
    void qc.invalidateQueries({ queryKey: CLAVE_PENDIENTES_REVISION });
  };
}

export function useCrearCampana() {
  const refrescar = useRefrescarCampanas();
  return useMutation({ mutationFn: (d: DatosCampana) => apiCampanas.crear(d), onSuccess: () => refrescar() });
}

export function useActualizarCampana(id: number) {
  const refrescar = useRefrescarCampanas();
  return useMutation({ mutationFn: (d: DatosCampana) => apiCampanas.actualizar(id, d), onSuccess: () => refrescar(id) });
}

export function useDuplicarCampana() {
  const refrescar = useRefrescarCampanas();
  return useMutation({ mutationFn: (id: number) => apiCampanas.duplicar(id), onSuccess: () => refrescar() });
}

export function useGuardarModalidad(idCampana: number) {
  const refrescar = useRefrescarCampanas();
  return useMutation({
    mutationFn: ({ id, datos }: { id?: number; datos: DatosModalidad }) => apiCampanas.guardarModalidad(idCampana, id, datos),
    onSuccess: () => refrescar(idCampana),
  });
}

export function useEliminarModalidad(idCampana: number) {
  const refrescar = useRefrescarCampanas();
  return useMutation({ mutationFn: (id: number) => apiCampanas.eliminarModalidad(id), onSuccess: () => refrescar(idCampana) });
}

export function useGuardarHito(idCampana: number) {
  const refrescar = useRefrescarCampanas();
  return useMutation({
    mutationFn: ({ id, datos }: { id?: number; datos: DatosHito }) => apiCampanas.guardarHito(idCampana, id, datos),
    onSuccess: () => refrescar(idCampana),
  });
}

export function useEliminarHito(idCampana: number) {
  const refrescar = useRefrescarCampanas();
  return useMutation({ mutationFn: (id: number) => apiCampanas.eliminarHito(id), onSuccess: () => refrescar(idCampana) });
}

export function useVerificarEnlaces(id: number) {
  return useMutation({ mutationFn: () => apiCampanas.verificarEnlaces(id) });
}

export function useEnviarRevisionCampana(id: number) {
  const refrescar = useRefrescarCampanas();
  return useMutation({ mutationFn: () => apiCampanas.enviarRevision(id), onSuccess: () => refrescar(id) });
}
