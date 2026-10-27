import { useEffect, useId, useState, type ReactNode } from 'react';
import clsx from 'clsx';
import { Search } from 'lucide-react';

/** Campo de búsqueda con espera (debounce) antes de notificar el cambio. */
export function CampoBusqueda({
  valor,
  onCambiar,
  placeholder = 'Buscar…',
  etiqueta = 'Buscar',
  espera = 350,
  className,
}: {
  valor: string;
  onCambiar: (valor: string) => void;
  placeholder?: string;
  etiqueta?: string;
  espera?: number;
  className?: string;
}) {
  const id = useId();
  const [texto, setTexto] = useState(valor);
  // Sincroniza si el valor externo cambia (p.ej. al limpiar filtros).
  const [previo, setPrevio] = useState(valor);
  if (previo !== valor) {
    setPrevio(valor);
    setTexto(valor);
  }
  useEffect(() => {
    if (texto === valor) return;
    const t = setTimeout(() => onCambiar(texto.trim()), espera);
    return () => clearTimeout(t);
  }, [texto, valor, espera, onCambiar]);

  return (
    <div className={clsx('relative', className)}>
      <label htmlFor={id} className="sr-only">
        {etiqueta}
      </label>
      <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <input
        id={id}
        type="search"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-md border border-gray-300 bg-white pl-9 pr-3 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
    </div>
  );
}

/**
 * Barra de filtros sobre un listado: búsqueda opcional a la izquierda,
 * filtros (`children`, p.ej. `<CampoSelect etiquetaOculta …/>`) y acciones a la derecha.
 */
export function FiltroBarra({
  busqueda,
  onBusqueda,
  placeholder,
  children,
  acciones,
  className,
}: {
  busqueda?: string;
  onBusqueda?: (q: string) => void;
  placeholder?: string;
  children?: ReactNode;
  acciones?: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="search"
      className={clsx('flex flex-col gap-3 md:flex-row md:flex-wrap md:items-end md:justify-between', className)}
    >
      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        {onBusqueda && (
          <CampoBusqueda
            valor={busqueda ?? ''}
            onCambiar={onBusqueda}
            placeholder={placeholder}
            className="w-full sm:w-72"
          />
        )}
        {children}
      </div>
      {acciones && <div className="flex flex-wrap gap-2">{acciones}</div>}
    </div>
  );
}

export default FiltroBarra;
