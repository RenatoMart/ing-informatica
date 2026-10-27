/**
 * Controlador (MVC, Sprint 3) de HU4 «Gestionar plan de estudios»: hooks de
 * TanStack Query sobre `/api/panel/planes` y `/cursos`. Las vistas solo
 * renderizan y llaman a estos hooks.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiPlanes } from '../api/planes';
import { useSesion } from '../sesion/SesionContext';
import { CLAVE_PENDIENTES_REVISION } from '../layout/rutasPanel';
import type { DatosCurso, DatosPlan, TipoPdfPlan } from '../modelos/planes';

export const CLAVES_PLAN = {
  lista: ['panel', 'planes'] as const,
  detalle: (id: number | string | undefined) => ['panel', 'planes', 'detalle', String(id)] as const,
  validacion: (id: number | string | undefined) => ['panel', 'planes', 'validacion', String(id)] as const,
};

/** Permisos del plan según el rol (§3.3): el predeterminado es solo del Revisor. */
export function usePermisosPlan() {
  const { tieneRol } = useSesion();
  return { puedeEditar: tieneRol('Editor', 'Revisor'), puedeEstablecerPredeterminado: tieneRol('Revisor') };
}

export function usePlanes() {
  return useQuery({ queryKey: CLAVES_PLAN.lista, queryFn: apiPlanes.listar });
}

export function usePlan(id: number | undefined) {
  return useQuery({
    queryKey: CLAVES_PLAN.detalle(id),
    queryFn: () => apiPlanes.obtener(id as number),
    enabled: id !== undefined && Number.isFinite(id),
  });
}

export function useValidacionPlan(id: number | undefined, habilitado = true) {
  return useQuery({
    queryKey: CLAVES_PLAN.validacion(id),
    queryFn: () => apiPlanes.validacion(id as number),
    enabled: habilitado && id !== undefined && Number.isFinite(id),
  });
}

/** Invalida lista, detalle, validación, historial y contador de la bandeja. */
function useRefrescarPlan() {
  const qc = useQueryClient();
  return (id?: number) => {
    void qc.invalidateQueries({ queryKey: CLAVES_PLAN.lista });
    if (id !== undefined) void qc.invalidateQueries({ queryKey: ['panel', 'revision', 'historial', 'plan', String(id)] });
    void qc.invalidateQueries({ queryKey: CLAVE_PENDIENTES_REVISION });
  };
}

export function useCrearPlan() {
  const refrescar = useRefrescarPlan();
  return useMutation({ mutationFn: (d: DatosPlan) => apiPlanes.crear(d), onSuccess: () => refrescar() });
}

export function useActualizarPlan(id: number) {
  const refrescar = useRefrescarPlan();
  return useMutation({ mutationFn: (d: DatosPlan) => apiPlanes.actualizar(id, d), onSuccess: () => refrescar(id) });
}

export function useDuplicarPlan() {
  const refrescar = useRefrescarPlan();
  return useMutation({
    mutationFn: ({ id, version }: { id: number; version: string }) => apiPlanes.duplicar(id, version),
    onSuccess: () => refrescar(),
  });
}

export function useEstablecerPredeterminado() {
  const refrescar = useRefrescarPlan();
  return useMutation({
    mutationFn: (id: number) => apiPlanes.establecerPredeterminado(id),
    onSuccess: (_r, id) => refrescar(id),
  });
}

export function useEnviarRevisionPlan(id: number) {
  const refrescar = useRefrescarPlan();
  return useMutation({ mutationFn: () => apiPlanes.enviarRevision(id), onSuccess: () => refrescar(id) });
}

export function useSubirPdfPlan(id: number) {
  const refrescar = useRefrescarPlan();
  return useMutation({
    mutationFn: ({ tipo, archivo }: { tipo: TipoPdfPlan; archivo: File }) => apiPlanes.subirPdf(id, tipo, archivo),
    onSuccess: () => refrescar(id),
  });
}

/** Alta o edición de un curso (`idCurso` indefinido = alta). */
export function useGuardarCurso(idPlan: number) {
  const refrescar = useRefrescarPlan();
  return useMutation({
    mutationFn: ({ idCurso, datos }: { idCurso?: number; datos: DatosCurso }) =>
      idCurso ? apiPlanes.actualizarCurso(idCurso, datos) : apiPlanes.crearCurso(idPlan, datos),
    onSuccess: () => refrescar(idPlan),
  });
}

export function useEliminarCurso(idPlan: number) {
  const refrescar = useRefrescarPlan();
  return useMutation({ mutationFn: (idCurso: number) => apiPlanes.eliminarCurso(idCurso), onSuccess: () => refrescar(idPlan) });
}

export function useImportarCursos(idPlan: number) {
  const refrescar = useRefrescarPlan();
  return useMutation({
    mutationFn: (cursos: DatosCurso[]) => apiPlanes.importarCursos(idPlan, cursos),
    onSuccess: () => refrescar(idPlan),
  });
}

export function useGuardarPrerrequisitos(idPlan: number) {
  const refrescar = useRefrescarPlan();
  return useMutation({
    mutationFn: ({ idCurso, requeridos }: { idCurso: number; requeridos: number[] }) =>
      apiPlanes.establecerPrerrequisitos(idCurso, requeridos),
    onSuccess: () => refrescar(idPlan),
  });
}
