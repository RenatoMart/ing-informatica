import { useEffect, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { siteName } from '../../profile';

/**
 * Título de una pantalla del panel (h1) + descripción + acciones.
 * También fija `document.title` = "<titulo> · Panel · <sitio>".
 */
export function EncabezadoPagina({
  titulo,
  descripcion,
  acciones,
  volver,
}: {
  titulo: string;
  descripcion?: ReactNode;
  acciones?: ReactNode;
  /** Enlace "volver" sobre el título: `{ a: '/panel/publicaciones', etiqueta: 'Publicaciones' }`. */
  volver?: { a: string; etiqueta: string };
}) {
  useEffect(() => {
    document.title = `${titulo} · Panel · ${siteName}`;
  }, [titulo]);

  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {volver && (
          <Link
            to={volver.a}
            className="mb-2 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            <ChevronLeft aria-hidden="true" className="h-4 w-4" />
            {volver.etiqueta}
          </Link>
        )}
        <h1 className="font-display text-2xl font-bold text-ink md:text-[1.7rem]">{titulo}</h1>
        {descripcion && <p className="mt-1 max-w-3xl text-sm text-gray-600">{descripcion}</p>}
      </div>
      {acciones && <div className="flex shrink-0 flex-wrap gap-2">{acciones}</div>}
    </header>
  );
}

/** Tarjeta blanca de contenido. */
export function Tarjeta({
  titulo,
  acciones,
  children,
  className = '',
}: {
  titulo?: ReactNode;
  acciones?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-lg border border-gray-200 bg-white shadow-sm ${className}`}>
      {(titulo || acciones) && (
        <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-5 py-3">
          {titulo && <h2 className="font-display text-base font-bold text-ink">{titulo}</h2>}
          {acciones}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}
