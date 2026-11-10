// Cifras de matriculados, egresados y graduados (página «Estadísticas» de Admisión).
// Se administran desde el panel; este archivo es solo el respaldo. Vacío a propósito: no se inventan cifras.
export interface EstadisticaAnual {
  anio: string;
  /** Matriculados del 1.º al 10.º ciclo; null = sin dato. */
  porCiclo: (number | null)[];
  total: number;
  egresados: number | null;
  bachilleres: number | null;
  nota?: string;
}

export const ciclosLabels = ['1ro', '2do', '3ro', '4to', '5to', '6to', '7mo', '8vo', '9no', '10mo'];

/** El año más reciente primero. */
export const estadisticasAnuales: EstadisticaAnual[] = [];

export const fuenteEstadisticas = { label: '', url: '' };
