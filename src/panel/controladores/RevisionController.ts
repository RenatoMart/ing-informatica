/** Controlador de la bandeja de revisión (Revisor). */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { revisionApi } from '../api/revision';
import { consultaPendientesRevision } from '../layout/pendientesRevision';
import { CLAVE_PENDIENTES_REVISION } from '../layout/rutasPanel';
import type { EntidadRevisable, PendienteRevision } from '../modelos/comunes';
import type { DatosDecidir } from '../modelos/revision';
import { useSesion } from '../sesion/SesionContext';

export function usePendientesRevision() {
  return useQuery(consultaPendientesRevision);
}

export function useDetalleRegistro(entidad: EntidadRevisable | undefined, id: number | undefined) {
  return useQuery({
    queryKey: ['panel', 'revision', 'detalle', entidad, id],
    queryFn: () => revisionApi.detalle(entidad as EntidadRevisable, id as number),
    enabled: !!entidad && id !== undefined,
  });
}

export function useDecidirRevision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (d: DatosDecidir) => revisionApi.decidir(d),
    onSuccess: (_r, d) => {
      void qc.invalidateQueries({ queryKey: CLAVE_PENDIENTES_REVISION });
      void qc.invalidateQueries({ queryKey: ['panel', 'revision', 'detalle', d.entidad, d.id] });
      void qc.invalidateQueries({ queryKey: ['panel', 'dashboard'] });
    },
  });
}

/** Motivo por el que el usuario actual no puede decidir (el backend lo vuelve a comprobar con 403). */
export function useMotivoBloqueo(p: PendienteRevision | null): string | null {
  const { usuario } = useSesion();
  if (!p || !usuario) return null;
  const yo = `${usuario.nombres} ${usuario.apellidos}`.trim().toLowerCase();
  return p.editor && p.editor.trim().toLowerCase() === yo
    ? 'Usted editó este contenido; otro Revisor debe decidir.'
    : null;
}

/** Cuenta de pendientes por entidad. */
export function contarPorEntidad(lista: PendienteRevision[] | undefined): Record<EntidadRevisable, number> {
  const c: Record<EntidadRevisable, number> = { publicacion: 0, docente: 0, plan: 0, documento: 0, campana: 0 };
  lista?.forEach((p) => {
    c[p.entidad] += 1;
  });
  return c;
}
