/** Controlador de la bandeja de consultas de contacto (clasificar, derivar, responder, descartar). */
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { consultasApi } from '../api/consultas';
import type { DatosClasificar, FiltrosConsultas } from '../modelos/consultas';

const RAIZ = ['panel', 'consultas'] as const;

export function useConsultas(f: FiltrosConsultas) {
  return useQuery({
    queryKey: [...RAIZ, 'lista', f],
    queryFn: () => consultasApi.listar({ por_pagina: 15, ...f }),
    placeholderData: keepPreviousData,
  });
}

export function useConsulta(id: number | null) {
  return useQuery({
    queryKey: [...RAIZ, 'detalle', id],
    queryFn: () => consultasApi.detalle(id as number),
    enabled: id !== null,
  });
}

export function useDepartamentos(activo: boolean) {
  return useQuery({
    queryKey: ['panel', 'departamentos', 'lista'],
    queryFn: consultasApi.departamentos,
    enabled: activo,
    staleTime: 5 * 60_000,
  });
}

export function useAccionesConsulta() {
  const qc = useQueryClient();
  const onSuccess = () => {
    void qc.invalidateQueries({ queryKey: RAIZ });
    void qc.invalidateQueries({ queryKey: ['panel', 'dashboard'] });
  };
  return {
    clasificar: useMutation({
      mutationFn: ({ id, datos }: { id: number; datos: DatosClasificar }) => consultasApi.clasificar(id, datos),
      onSuccess,
    }),
    responder: useMutation({
      mutationFn: ({ id, respuesta }: { id: number; respuesta: string }) => consultasApi.responder(id, respuesta),
      onSuccess,
    }),
  };
}

// ── Validaciones (§6.3) ─────────────────────────────────────────────────────

export function validarRespuesta(texto: string): string | null {
  const n = texto.trim().length;
  if (n < 10) return 'La respuesta debe tener al menos 10 caracteres.';
  if (n > 5000) return 'La respuesta no debe superar 5000 caracteres.';
  return null;
}

export function validarClasificacion(d: { destino: string; id_departamento: string; nota: string }): Record<string, string> {
  const e: Record<string, string> = {};
  if (!d.destino) e.destino = 'Seleccione el destino.';
  if (d.destino === 'area' && !d.id_departamento) e.id_departamento = 'Seleccione el departamento responsable.';
  if (d.destino === 'externa' && !d.nota.trim()) e.nota = 'Indique el canal adecuado al que se reorienta la consulta.';
  if (d.nota.length > 1000) e.nota = 'La nota no debe superar 1000 caracteres.';
  return e;
}
