/** Controlador de estadísticas de visitas. */
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { estadisticasApi } from '../api/estadisticas';
import type { VisitaDia } from '../modelos/dashboard';

export function iso(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function rangoPorDefecto(dias = 30): { desde: string; hasta: string } {
  const hasta = new Date();
  const desde = new Date();
  desde.setDate(hasta.getDate() - (dias - 1));
  return { desde: iso(desde), hasta: iso(hasta) };
}

/** desde ≤ hasta y rango ≤ 366 días. */
export function validarRango(desde: string, hasta: string): string | null {
  if (!desde || !hasta) return 'Indique las fechas inicial y final.';
  if (desde > hasta) return 'La fecha inicial no puede ser posterior a la final.';
  const dias = (Date.parse(hasta) - Date.parse(desde)) / 86_400_000 + 1;
  if (dias > 366) return 'El rango no puede superar 366 días.';
  return null;
}

export function useEstadisticasVisitas(desde: string, hasta: string) {
  const error = validarRango(desde, hasta);
  const consulta = useQuery({
    queryKey: ['panel', 'estadisticas', 'visitas', desde, hasta],
    queryFn: () => estadisticasApi.visitas(desde, hasta),
    enabled: !error,
    placeholderData: keepPreviousData,
  });
  return { consulta, errorRango: error };
}

/** Suma de visitas por día (todas las secciones), rellenando días sin datos. */
export function totalesPorDia(filas: VisitaDia[], desde: string, hasta: string): { dia: string; total: number }[] {
  const mapa = new Map<string, number>();
  filas.forEach((f) => mapa.set(f.dia.slice(0, 10), (mapa.get(f.dia.slice(0, 10)) ?? 0) + Number(f.total)));
  const salida: { dia: string; total: number }[] = [];
  const fin = new Date(`${hasta}T00:00:00`);
  for (let d = new Date(`${desde}T00:00:00`); d <= fin; d.setDate(d.getDate() + 1)) {
    const k = iso(d);
    salida.push({ dia: k, total: mapa.get(k) ?? 0 });
  }
  return salida;
}
