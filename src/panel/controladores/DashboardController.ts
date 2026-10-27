/** Controlador del dashboard (KPIs según el rol). */
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboard';

export function useDashboard() {
  return useQuery({
    queryKey: ['panel', 'dashboard'],
    queryFn: dashboardApi.obtener,
    staleTime: 30_000,
  });
}
