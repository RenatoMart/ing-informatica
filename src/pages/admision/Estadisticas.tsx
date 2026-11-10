import React, { useEffect, useMemo } from 'react';
import { BarChart3, ExternalLink } from 'lucide-react';
import PageWrapper from '../../components/layout/PageWrapper';
import PageHero from '../../components/layout/PageHero';
import EnConstruccion from '../../components/layout/EnConstruccion';
import AnchoredSection from '../../components/layout/AnchoredSection';
import { site, siteName } from '@/profile';
import {
  estadisticasAnuales,
  ciclosLabels,
  fuenteEstadisticas,
} from '@profile/content/estadisticas';

/**
 * Estadísticas del programa (Tabla 0-1).
 *
 * Color: una sola familia azul, validada para daltonismo y contraste.
 *   - SERIE_A (#12377B, azul institucional) → Egresados
 *   - SERIE_B (#5B84C4, azul claro)         → Grados de Bachiller
 * El dorado NO se usa para rellenos: sobre fondo claro su contraste es 1.98:1
 * (ilegible). Queda solo como acento fino.
 * Los ciclos son UNA sola serie, así que van todos del mismo color (no un
 * degradado por tamaño: eso duplicaría en color lo que la altura ya dice).
 */
const SERIE_A = '#12377B';
const SERIE_B = '#5B84C4';

/** Celda numérica: guion cuando la fuente no reporta dato. */
function Num({ value }: { value: number | null }) {
  return value === null
    ? <span className="text-gray-300" aria-label="Sin dato">—</span>
    : <>{value}</>;
}

/** Cifra destacada. Sans (no serif) y sin tabular-nums, según specs de figura. */
function StatTile({ valor, etiqueta, periodo }: { valor: number; etiqueta: string; periodo: string }) {
  return (
    <div className="border-l-4 border-gold pl-5 py-1">
      <div className="font-sans font-semibold text-primary text-5xl leading-none tracking-tight">
        {valor}
      </div>
      <div className="mt-2 text-sm font-bold text-gray-700">{etiqueta}</div>
      <div className="text-xs text-gray-400">{periodo}</div>
    </div>
  );
}

export default function Estadisticas() {
  useEffect(() => {
    document.title = `Estadísticas | Admisión | ${siteName}`;
  }, []);

  // Datos ordenados cronológicamente para las series temporales.
  const cronologico = useMemo(() => [...estadisticasAnuales].reverse(), []);
  const actual = estadisticasAnuales[0];                       // año más reciente (parcial)
  const ultimoCerrado = estadisticasAnuales.find((e) => e.egresados !== null);

  if (!actual) {
    return (
      <PageWrapper>
        <PageHero title="Estadísticas" subtitle={`Cifras de matriculados, egresados y graduados de la ${site.programa.nombre}.`} icon={BarChart3} breadcrumbs={[{ label: 'Admisión' }, { label: 'Estadísticas' }]} />
        <EnConstruccion titulo="Es**tadísticas**" descripcion="Estamos preparando las cifras oficiales de matriculados, egresados y graduados." />
      </PageWrapper>
    );
  }

  // Escalas: un único máximo por gráfico, para que las alturas sean comparables.
  const maxCiclo = Math.max(1, ...actual.porCiclo.map((n) => n ?? 0));
  const maxEgreso = Math.max(1, ...cronologico.flatMap((e) => [e.egresados ?? 0, e.bachilleres ?? 0]));
  const conEgresados = cronologico.filter((e) => e.egresados !== null);

  return (
    <PageWrapper>
      <PageHero
        title="Estadísticas"
        subtitle={`Cifras oficiales de matriculados, egresados y graduados de la ${site.programa.nombre}.`}
        icon={BarChart3}
        breadcrumbs={[{ label: 'Admisión' }, { label: 'Estadísticas' }]}
      />

      {/* ── Cifras destacadas ── */}
      <div className="bg-white pt-14 md:pt-16">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-10">
            <StatTile valor={actual.total} etiqueta="Estudiantes matriculados" periodo={actual.nota ? `${actual.anio} · cifras parciales` : actual.anio} />
            {ultimoCerrado && <StatTile valor={ultimoCerrado.egresados ?? 0} etiqueta="Egresados" periodo={`${ultimoCerrado.anio} · último año cerrado`} />}
            {ultimoCerrado && <StatTile valor={ultimoCerrado.bachilleres ?? 0} etiqueta="Grados de Bachiller" periodo={`${ultimoCerrado.anio} · último año cerrado`} />}
          </div>
        </div>
      </div>

      {/* ── Matriculados por ciclo ── */}
      <AnchoredSection id="matriculados">
        <div className="bg-white py-14 md:py-16">
          <div className="container mx-auto px-4 md:px-8">
            <div className="max-w-5xl mx-auto">
              <h2 className="font-display font-black text-primary text-2xl md:text-3xl leading-tight">
                Matriculados por ciclo
              </h2>
              <p className="text-gray-500 text-sm mt-2 mb-10">
                Distribución de estudiantes en los diez semestres académicos, {actual.anio}.
              </p>

              {/* Columnas: una sola serie → un solo color. */}
              <div className="flex items-end gap-2 sm:gap-3 h-52" role="img"
                aria-label={`Matriculados por ciclo en ${actual.anio}: ${actual.porCiclo.map((n, i) => `${ciclosLabels[i]} ${n ?? 'sin dato'}`).join(', ')}.`}
              >
                {actual.porCiclo.map((n, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-2">
                    <span className="text-[11px] font-semibold text-gray-500 tabular-nums">
                      {n ?? ''}
                    </span>
                    <div
                      className="w-full rounded-t"
                      style={{
                        height: `${((n ?? 0) / maxCiclo) * 100}%`,
                        backgroundColor: n === null ? '#E5E7EB' : SERIE_A,
                        minHeight: n === null ? 2 : 4,
                      }}
                    />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                      {ciclosLabels[i]}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-xs text-gray-400">
                Las barras en gris corresponden a ciclos sin dato reportado en {actual.anio}.
              </p>
            </div>
          </div>
        </div>
      </AnchoredSection>

      {/* ── Egresados y graduados ── */}
      <AnchoredSection id="egresados">
        <div className="bg-gray-50 py-14 md:py-16">
          <div className="container mx-auto px-4 md:px-8">
            <div className="max-w-5xl mx-auto">
              <span id="graduados" className="block scroll-mt-[180px]" aria-hidden="true" />

              <h2 className="font-display font-black text-primary text-2xl md:text-3xl leading-tight">
                Egresados y graduados
              </h2>
              <p className="text-gray-500 text-sm mt-2 mb-6">
                Evolución anual de egresados y grados de Bachiller otorgados.
              </p>

              {/* Leyenda: obligatoria con 2 series. */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-8 text-xs font-semibold text-gray-600">
                <span className="inline-flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: SERIE_A }} /> Egresados
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: SERIE_B }} /> Grados de Bachiller
                </span>
              </div>

              <div className="flex items-end gap-3 sm:gap-6 h-56" role="img"
                aria-label={`Egresados y grados de Bachiller por año: ${conEgresados.map((e) => `${e.anio}, ${e.egresados} egresados y ${e.bachilleres} bachilleres`).join('; ')}.`}
              >
                {conEgresados.map((e) => (
                  <div key={e.anio} className="flex-1 flex flex-col items-center justify-end h-full">
                    {/* 2px de separación entre barras adyacentes */}
                    <div className="w-full flex items-end justify-center gap-[2px] h-full">
                      <div className="w-1/2 flex flex-col items-center justify-end h-full gap-1.5">
                        <span className="text-[11px] font-semibold text-gray-500 tabular-nums">{e.egresados}</span>
                        <div className="w-full rounded-t" style={{ height: `${((e.egresados ?? 0) / maxEgreso) * 100}%`, backgroundColor: SERIE_A }} />
                      </div>
                      <div className="w-1/2 flex flex-col items-center justify-end h-full gap-1.5">
                        <span className="text-[11px] font-semibold text-gray-500 tabular-nums">{e.bachilleres}</span>
                        <div className="w-full rounded-t" style={{ height: `${((e.bachilleres ?? 0) / maxEgreso) * 100}%`, backgroundColor: SERIE_B }} />
                      </div>
                    </div>
                    <span className="mt-2 text-[11px] font-bold text-gray-500">{e.anio}</span>
                  </div>
                ))}
              </div>

              <p className="mt-6 text-xs text-gray-500 leading-relaxed max-w-2xl">
                <strong className="font-semibold text-gray-600">Egresado</strong> es quien concluyó el plan
                de estudios; <strong className="font-semibold text-gray-600">graduado</strong> es quien
                además obtuvo el grado académico de Bachiller.
              </p>
            </div>
          </div>
        </div>
      </AnchoredSection>

      {/* ── Detalle completo ── */}
      <div className="bg-white py-14 md:py-16">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-6xl mx-auto">
            <h2 className="font-display font-black text-primary text-2xl md:text-3xl leading-tight">
              Detalle por año
            </h2>
            <p className="text-gray-500 text-sm mt-2 mb-8">
              Cifras completas {cronologico[0].anio}–{actual.anio}.
            </p>

            <div className="overflow-x-auto border-t border-gray-200">
              <table className="w-full border-collapse text-sm min-w-[860px] tabular-nums">
                <caption className="sr-only">
                  Matriculados por semestre académico, total anual, egresados y grados de Bachiller.
                </caption>
                <thead>
                  <tr className="border-b border-gray-200">
                    <th scope="col" className="py-3 px-3 text-left font-bold uppercase tracking-wider text-[10px] text-gray-500">Año</th>
                    {ciclosLabels.map((c) => (
                      <th key={c} scope="col" className="py-3 px-2 text-center font-bold uppercase tracking-wider text-[10px] text-gray-400">{c}</th>
                    ))}
                    <th scope="col" className="py-3 px-3 text-center font-bold uppercase tracking-wider text-[10px] text-gray-500">Total</th>
                    <th scope="col" className="py-3 px-3 text-center font-bold uppercase tracking-wider text-[10px] text-gray-500">Egres.</th>
                    <th scope="col" className="py-3 px-3 text-center font-bold uppercase tracking-wider text-[10px] text-gray-500">Bach.</th>
                  </tr>
                </thead>
                <tbody>
                  {estadisticasAnuales.map((fila) => (
                    <tr key={fila.anio} className="border-b border-gray-100 transition-colors hover:bg-gray-50">
                      <th scope="row" className="py-3 px-3 text-left font-bold text-primary whitespace-nowrap">
                        {fila.anio}
                        {fila.nota && <span className="text-gold" aria-hidden="true">*</span>}
                      </th>
                      {fila.porCiclo.map((n, i) => (
                        <td key={i} className="py-3 px-2 text-center text-gray-500"><Num value={n} /></td>
                      ))}
                      <td className="py-3 px-3 text-center font-bold text-primary">{fila.total}</td>
                      <td className="py-3 px-3 text-center text-gray-700 font-semibold"><Num value={fila.egresados} /></td>
                      <td className="py-3 px-3 text-center text-gray-700 font-semibold"><Num value={fila.bachilleres} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {estadisticasAnuales.filter((e) => e.nota).map((n) => (
              <p key={n.anio} className="mt-4 text-xs text-gray-500">
                <span className="text-gold font-bold">*</span> {n.nota}
              </p>
            ))}

            {fuenteEstadisticas.url && <a
              href={fuenteEstadisticas.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-gold-ink transition-colors"
            >
              Fuente: {fuenteEstadisticas.label || fuenteEstadisticas.url} <ExternalLink className="w-3.5 h-3.5" />
            </a>}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
