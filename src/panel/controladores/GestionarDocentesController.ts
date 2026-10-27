/**
 * Controlador (MVC, Sprint 3) de Docentes y Departamentos (HU3): hooks
 * TanStack Query sobre `/api/panel/docentes` y `/api/panel/departamentos`.
 */
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { esApiError } from '../../lib/api';
import { departamentosApi } from '../api/departamentos';
import { docentesApi } from '../api/docentes';
import { CLAVE_PENDIENTES_REVISION } from '../layout/rutasPanel';
import { useToast } from '../componentes/Toast';
import type { DatosDepartamento, DatosDocente, FiltrosDocentes } from '../modelos/docentes';

export { idDeRuta } from './PublicarContenidoController';

export const CLAVES_DOCENTES = {
  todo: ['panel', 'docentes'] as const,
  lista: (f: FiltrosDocentes) => ['panel', 'docentes', 'lista', f] as const,
  detalle: (id: number) => ['panel', 'docentes', 'detalle', id] as const,
  departamentos: ['panel', 'departamentos'] as const,
};

const sinToastDeValidacion = (toast: ReturnType<typeof useToast>) => (e: unknown) => {
  if (!(esApiError(e) && e.esValidacion)) toast.error(e);
};

export function useDocentes(filtros: FiltrosDocentes) {
  return useQuery({
    queryKey: CLAVES_DOCENTES.lista(filtros),
    queryFn: ({ signal }) => docentesApi.listar(filtros, signal),
    placeholderData: keepPreviousData,
  });
}

export function useDocente(id: number | undefined) {
  return useQuery({
    queryKey: CLAVES_DOCENTES.detalle(id ?? 0),
    queryFn: ({ signal }) => docentesApi.detalle(id as number, signal),
    enabled: id !== undefined,
    retry: (n, e) => !(esApiError(e) && e.status < 500 && e.status !== 0) && n < 2,
  });
}

export function useDepartamentos() {
  return useQuery({
    queryKey: CLAVES_DOCENTES.departamentos,
    queryFn: ({ signal }) => departamentosApi.listar(signal),
    staleTime: 5 * 60_000,
  });
}

function useRefrescar() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: CLAVES_DOCENTES.todo });
    void qc.invalidateQueries({ queryKey: ['panel', 'revision'] });
    void qc.invalidateQueries({ queryKey: CLAVE_PENDIENTES_REVISION });
  };
}

/** Alta o edición de un departamento (sin `id` = alta). Devuelve el id. */
export function useGuardarDepartamento() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: async (p: { id?: number; datos: DatosDepartamento }): Promise<number> => {
      if (p.id === undefined) return (await departamentosApi.crear(p.datos)).id_departamento;
      await departamentosApi.actualizar(p.id, p.datos);
      return p.id;
    },
    onSuccess: (_id, v) => {
      void qc.invalidateQueries({ queryKey: CLAVES_DOCENTES.departamentos });
      void qc.invalidateQueries({ queryKey: CLAVES_DOCENTES.todo });
      toast.exito(v.id === undefined ? 'Departamento creado.' : 'Departamento actualizado.');
    },
    onError: sinToastDeValidacion(toast),
  });
}

export interface FotoPendiente {
  archivo: File | null;
  encuadreX: number;
  encuadreY: number;
}

/** Sube la foto (con encuadre) si hay archivo nuevo; si no, solo actualiza el encuadre. */
export function useGuardarFoto(id: number | undefined) {
  const refrescar = useRefrescar();
  const toast = useToast();
  return useMutation({
    mutationFn: async (f: FotoPendiente) => {
      if (id === undefined) throw new Error('Guarde primero los datos del docente.');
      if (f.archivo) await docentesApi.subirFoto(id, f.archivo, f.encuadreX, f.encuadreY);
      else await docentesApi.encuadre(id, f.encuadreX, f.encuadreY);
      return f.archivo !== null;
    },
    onSuccess: (conArchivo) => {
      refrescar();
      toast.exito(conArchivo ? 'Foto y encuadre guardados.' : 'Encuadre guardado.');
    },
    onError: sinToastDeValidacion(toast),
  });
}

export interface ResultadoGuardadoDocente {
  id: number;
  creado: boolean;
  modo?: 'directo' | 'cambio_pendiente';
  errorFoto?: unknown;
}

/** Crea (sin `id`) o actualiza. Al crear, sube la foto pendiente si la hay. */
export function useGuardarDocente() {
  const refrescar = useRefrescar();
  const toast = useToast();
  return useMutation({
    mutationFn: async (p: { id?: number; datos: DatosDocente; foto?: FotoPendiente | null }): Promise<ResultadoGuardadoDocente> => {
      if (p.id === undefined) {
        const r = await docentesApi.crear(p.datos);
        let errorFoto: unknown;
        if (p.foto) {
          try {
            if (p.foto.archivo) await docentesApi.subirFoto(r.id_docente, p.foto.archivo, p.foto.encuadreX, p.foto.encuadreY);
            else await docentesApi.encuadre(r.id_docente, p.foto.encuadreX, p.foto.encuadreY);
          } catch (e) {
            errorFoto = e;
          }
        }
        return { id: r.id_docente, creado: true, errorFoto };
      }
      const r = await docentesApi.actualizar(p.id, p.datos);
      return { id: p.id, creado: false, modo: r.modo };
    },
    onSuccess: (r) => {
      refrescar();
      if (r.creado) toast.exito('Docente registrado como borrador.');
      else if (r.modo === 'cambio_pendiente')
        toast.exito('Cambios guardados como propuesta; se aplicarán cuando el Director los apruebe.');
      else toast.exito('Borrador guardado.');
    },
    onError: sinToastDeValidacion(toast),
  });
}

export type AccionDocente = 'enviar-revision' | 'solicitar-baja' | 'reactivar';

const MENSAJES_ACCION: Record<AccionDocente, string> = {
  'enviar-revision': 'Docente enviado a revisión.',
  'solicitar-baja': 'Baja solicitada; el Director debe aprobarla.',
  reactivar: 'Docente reactivado como borrador.',
};

export function useAccionDocente() {
  const refrescar = useRefrescar();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ id, accion }: { id: number; accion: AccionDocente }) =>
      accion === 'enviar-revision'
        ? docentesApi.enviarRevision(id)
        : accion === 'solicitar-baja'
          ? docentesApi.solicitarBaja(id)
          : docentesApi.reactivar(id),
    onSuccess: (_r, v) => {
      refrescar();
      toast.exito(MENSAJES_ACCION[v.accion]);
    },
    onError: sinToastDeValidacion(toast),
  });
}
