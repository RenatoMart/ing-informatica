import { useId, useMemo, useState } from 'react';
import { AlertaFormulario, CampoTexto, Cargando, EncabezadoPagina, ErrorEstado, Tarjeta, Vacio } from '../componentes';
import { rangoPorDefecto, totalesPorDia, useEstadisticasVisitas } from '../controladores/EstadisticasController';
import { ETIQUETA_SECCION } from '../modelos/dashboard';

const nf = new Intl.NumberFormat('es-PE');
const etiquetaSeccion = (s: string) => ETIQUETA_SECCION[s] ?? s.replace(/_/g, ' ');

function Barras({ datos }: { datos: { seccion: string; total: number }[] }) {
  const max = Math.max(1, ...datos.map((d) => Number(d.total)));
  return (
    <ul className="space-y-3">
      {datos.map((d) => (
        <li key={d.seccion}>
          <div className="mb-1 flex justify-between text-sm">
            <span className="font-semibold text-ink">{etiquetaSeccion(d.seccion)}</span>
            <span className="tabular-nums text-gray-700">{nf.format(Number(d.total))}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-gray-100" aria-hidden="true">
            <div className="h-full rounded-full bg-primary" style={{ width: `${(Number(d.total) / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function Linea({ puntos }: { puntos: { dia: string; total: number }[] }) {
  const titulo = useId();
  const W = 640, H = 220, PI = 40, PD = 12, PS = 12, PB = 28;
  const max = Math.max(1, ...puntos.map((p) => p.total));
  const n = puntos.length;
  const x = (i: number) => PI + (n <= 1 ? (W - PI - PD) / 2 : (i * (W - PI - PD)) / (n - 1));
  const y = (v: number) => PS + (1 - v / max) * (H - PS - PB);
  const linea = puntos.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.total).toFixed(1)}`).join(' ');
  const area = n > 1 ? `${linea} L${x(n - 1)},${H - PB} L${x(0)},${H - PB} Z` : '';
  const marcas = [0, 0.5, 1].map((f) => Math.round(max * f));
  const corto = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby={titulo} className="h-auto w-full">
        <title id={titulo}>{`Visitas por día, de ${corto(puntos[0].dia)} a ${corto(puntos[n - 1].dia)}. Máximo ${nf.format(max)} en un día.`}</title>
        {marcas.map((m) => (
          <g key={m}>
            <line x1={PI} x2={W - PD} y1={y(m)} y2={y(m)} stroke="#e5e7eb" />
            <text x={PI - 6} y={y(m) + 4} textAnchor="end" fontSize="11" fill="#4b5563">{nf.format(m)}</text>
          </g>
        ))}
        {area && <path d={area} fill="#12377B" opacity="0.08" />}
        <path d={linea} fill="none" stroke="#12377B" strokeWidth="2" strokeLinejoin="round" />
        {n <= 60 && puntos.map((p, i) => (
          <circle key={p.dia} cx={x(i)} cy={y(p.total)} r="3" fill="#12377B"><title>{`${corto(p.dia)}: ${nf.format(p.total)}`}</title></circle>
        ))}
        <text x={PI} y={H - 8} fontSize="11" fill="#4b5563">{corto(puntos[0].dia)}</text>
        <text x={W - PD} y={H - 8} textAnchor="end" fontSize="11" fill="#4b5563">{corto(puntos[n - 1].dia)}</text>
      </svg>
      <figcaption className="sr-only">Evolución diaria de visitas en el rango seleccionado.</figcaption>
    </figure>
  );
}

/** `/panel/estadisticas` — visitas por sección (barras) y por día (línea), SVG/CSS propio. */
export default function PaginaEstadisticas() {
  const inicial = useMemo(() => rangoPorDefecto(30), []);
  const [desde, setDesde] = useState(inicial.desde);
  const [hasta, setHasta] = useState(inicial.hasta);
  const { consulta, errorRango } = useEstadisticasVisitas(desde, hasta);
  const d = consulta.data;
  const secciones = useMemo(() => [...(d?.por_seccion ?? [])].sort((a, b) => Number(b.total) - Number(a.total)), [d]);
  const dias = useMemo(() => (d && !errorRango ? totalesPorDia(d.por_dia, desde, hasta) : []), [d, desde, hasta, errorRango]);
  const total = secciones.reduce((a, s) => a + Number(s.total), 0);

  return (
    <>
      <EncabezadoPagina titulo="Estadísticas" descripcion="Visitas anónimas al sitio público por sección. El rango máximo es de 366 días." />
      <div className="mb-6 grid gap-4 sm:max-w-lg sm:grid-cols-2">
        <CampoTexto etiqueta="Desde" type="date" value={desde} max={hasta || undefined} onChange={(e) => setDesde(e.target.value)} />
        <CampoTexto etiqueta="Hasta" type="date" value={hasta} min={desde || undefined} onChange={(e) => setHasta(e.target.value)} />
      </div>
      {errorRango && <AlertaFormulario error={new Error(errorRango)} className="mb-6" />}
      {!errorRango && consulta.isLoading && <Cargando etiqueta="Cargando estadísticas…" />}
      {!errorRango && consulta.isError && <ErrorEstado error={consulta.error} onReintentar={() => void consulta.refetch()} />}
      {!errorRango && d && (total === 0 ? (
        <Vacio titulo="Sin visitas en el rango" descripcion="Pruebe con otro rango de fechas." />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Tarjeta titulo={`Visitas por sección (${nf.format(total)} en total)`}>
            <Barras datos={secciones} />
          </Tarjeta>
          <Tarjeta titulo="Visitas por día">
            {dias.length > 0 && <Linea puntos={dias} />}
          </Tarjeta>
        </div>
      ))}
    </>
  );
}
