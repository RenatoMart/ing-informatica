import { useCallback, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import clsx from 'clsx';

export interface Pestana {
  id: string;
  etiqueta: ReactNode;
  /** Número a mostrar junto a la etiqueta (p.ej. pendientes). */
  contador?: number;
  oculta?: boolean;
}

/**
 * Pestañas accesibles (patrón ARIA tabs, flechas ←/→, Inicio/Fin).
 * El contenido se pinta fuera con `<PanelPestana id activa>`.
 */
export function Pestanas({
  pestanas,
  activa,
  onCambiar,
  etiqueta,
  idBase = 'pst',
  className,
}: {
  pestanas: Pestana[];
  activa: string;
  onCambiar: (id: string) => void;
  /** Nombre accesible del grupo. */
  etiqueta: string;
  idBase?: string;
  className?: string;
}) {
  const visibles = pestanas.filter((p) => !p.oculta);
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  const alTeclado = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    let j = -1;
    if (e.key === 'ArrowRight') j = (i + 1) % visibles.length;
    else if (e.key === 'ArrowLeft') j = (i - 1 + visibles.length) % visibles.length;
    else if (e.key === 'Home') j = 0;
    else if (e.key === 'End') j = visibles.length - 1;
    if (j < 0) return;
    e.preventDefault();
    const id = visibles[j].id;
    onCambiar(id);
    refs.current[id]?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label={etiqueta}
      className={clsx('flex gap-1 overflow-x-auto border-b border-gray-200', className)}
    >
      {visibles.map((p, i) => {
        const sel = p.id === activa;
        return (
          <button
            key={p.id}
            ref={(el) => {
              refs.current[p.id] = el;
            }}
            type="button"
            role="tab"
            id={`${idBase}-tab-${p.id}`}
            aria-selected={sel}
            aria-controls={`${idBase}-panel-${p.id}`}
            tabIndex={sel ? 0 : -1}
            onClick={() => onCambiar(p.id)}
            onKeyDown={(e) => alTeclado(e, i)}
            className={clsx(
              '-mb-px inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold',
              sel ? 'border-gold text-primary' : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-ink',
            )}
          >
            {p.etiqueta}
            {p.contador !== undefined && p.contador > 0 && (
              <span className="rounded-full bg-primary/10 px-2 text-xs text-primary">{p.contador}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Contenedor del contenido de una pestaña (solo se monta si está activa). */
export function PanelPestana({
  id,
  activa,
  idBase = 'pst',
  children,
  className,
}: {
  id: string;
  activa: string;
  idBase?: string;
  children: ReactNode;
  className?: string;
}) {
  if (id !== activa) return null;
  return (
    <div
      role="tabpanel"
      id={`${idBase}-panel-${id}`}
      aria-labelledby={`${idBase}-tab-${id}`}
      tabIndex={0}
      className={clsx('pt-5 focus:outline-none', className)}
    >
      {children}
    </div>
  );
}

/**
 * Pestaña activa sincronizada con `?pestana=` (así los enlaces y redirecciones
 * como `/panel/bitacora → /panel/usuarios?pestana=bitacora` abren la correcta).
 */
export function usePestanaUrl(ids: readonly string[], porDefecto: string = ids[0]): [string, (id: string) => void] {
  const [params, setParams] = useSearchParams();
  const actual = params.get('pestana');
  const activa = actual && ids.includes(actual) ? actual : porDefecto;
  const cambiar = useCallback(
    (id: string) => {
      setParams(
        (p) => {
          const n = new URLSearchParams(p);
          n.set('pestana', id);
          n.delete('pagina');
          return n;
        },
        { replace: true },
      );
    },
    [setParams],
  );
  return [activa, cambiar];
}
