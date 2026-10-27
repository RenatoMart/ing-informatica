import { useQuery } from '@tanstack/react-query';

export interface ResultadoConRespaldo<T> {
  datos: T | undefined;
  cargando: boolean;
  origen: 'api' | 'respaldo';
}

/**
 * Consulta con respaldo estático (docs/DISENO_BACKEND.md §7.1): si la API falla
 * (red o 5xx) devuelve `respaldo`; si responde, usa lo que llegue aunque esté vacío.
 */
export function useApiConRespaldo<T>(
  clave: readonly unknown[],
  fetcher: () => Promise<T>,
  respaldo: T,
  opciones: { enabled?: boolean } = {},
): ResultadoConRespaldo<T> {
  const q = useQuery({
    queryKey: ['publico', ...clave],
    queryFn: fetcher,
    staleTime: 5 * 60_000,
    retry: 1,
    enabled: opciones.enabled ?? true,
  });
  if (q.isError) {
    if (typeof console !== 'undefined') console.warn('[API pública] usando contenido de respaldo:', clave.join('/'));
    return { datos: respaldo, cargando: false, origen: 'respaldo' };
  }
  return { datos: q.data, cargando: q.isLoading, origen: 'api' };
}
