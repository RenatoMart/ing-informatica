import { QueryClient } from '@tanstack/react-query';
import { esApiError } from './api';

/**
 * Cliente de TanStack Query compartido por el sitio público y el panel.
 *
 * Convención de claves: las del panel empiezan por `'panel'`
 * (p.ej. `['panel', 'publicaciones', filtros]`) para poder purgarlas al cerrar
 * sesión; la sesión vive en `['sesion']`; las públicas, en `['publico', …]`.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      // Reintenta una vez solo los fallos de red o 5xx; nunca los 4xx.
      retry: (intentos, error) => {
        if (esApiError(error) && error.status >= 400 && error.status < 500) return false;
        return intentos < 1;
      },
    },
    mutations: {
      retry: false,
    },
  },
});
