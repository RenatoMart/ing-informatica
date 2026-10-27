import clsx from 'clsx';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { MetaPaginacion } from '../modelos/comunes';

/** Páginas a mostrar: 1 … p-1 p p+1 … n */
function rango(actual: number, ultima: number): Array<number | '…'> {
  const set = new Set([1, ultima, actual - 1, actual, actual + 1].filter((n) => n >= 1 && n <= ultima));
  const nums = [...set].sort((a, b) => a - b);
  const r: Array<number | '…'> = [];
  nums.forEach((n, i) => {
    if (i > 0 && n - nums[i - 1] > 1) r.push('…');
    r.push(n);
  });
  return r;
}

const BTN =
  'inline-flex h-9 min-w-9 items-center justify-center rounded-md px-2 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:cursor-not-allowed disabled:opacity-40';

/** Paginación de un listado §5.1 (`meta`). No se muestra si hay una sola página. */
export function Paginacion({
  meta,
  onCambiar,
  className,
}: {
  meta: MetaPaginacion | undefined;
  onCambiar: (pagina: number) => void;
  className?: string;
}) {
  if (!meta || meta.total === 0) return null;
  const { pagina, ultima_pagina, total, por_pagina } = meta;
  const desde = (pagina - 1) * por_pagina + 1;
  const hasta = Math.min(pagina * por_pagina, total);
  return (
    <nav
      aria-label="Paginación"
      className={clsx('flex flex-col items-center justify-between gap-3 py-3 text-sm text-gray-600 sm:flex-row', className)}
    >
      <p aria-live="polite">
        Mostrando <strong className="text-ink">{desde}</strong>–<strong className="text-ink">{hasta}</strong> de{' '}
        <strong className="text-ink">{total}</strong>
      </p>
      {ultima_pagina > 1 && (
        <ul className="flex items-center gap-1">
          <li>
            <button
              type="button"
              className={clsx(BTN, 'text-primary hover:bg-primary/10')}
              onClick={() => onCambiar(pagina - 1)}
              disabled={pagina <= 1}
              aria-label="Página anterior"
            >
              <ChevronLeft aria-hidden="true" className="h-4 w-4" />
            </button>
          </li>
          {rango(pagina, ultima_pagina).map((n, i) =>
            n === '…' ? (
              <li key={`e${i}`} aria-hidden="true" className="px-1">
                …
              </li>
            ) : (
              <li key={n}>
                <button
                  type="button"
                  className={clsx(BTN, n === pagina ? 'bg-primary text-white' : 'text-primary hover:bg-primary/10')}
                  onClick={() => onCambiar(n)}
                  aria-current={n === pagina ? 'page' : undefined}
                  aria-label={`Página ${n}`}
                >
                  {n}
                </button>
              </li>
            ),
          )}
          <li>
            <button
              type="button"
              className={clsx(BTN, 'text-primary hover:bg-primary/10')}
              onClick={() => onCambiar(pagina + 1)}
              disabled={pagina >= ultima_pagina}
              aria-label="Página siguiente"
            >
              <ChevronRight aria-hidden="true" className="h-4 w-4" />
            </button>
          </li>
        </ul>
      )}
    </nav>
  );
}

export default Paginacion;
