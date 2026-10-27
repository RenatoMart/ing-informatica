import type { ReactNode } from 'react';
import clsx from 'clsx';
import { AlertTriangle, Inbox, RotateCw, WifiOff } from 'lucide-react';
import { esApiError, mensajeDeError } from '../../lib/api';

/** Indicador de carga accesible (role=status). */
export function Cargando({
  etiqueta = 'Cargando…',
  pantallaCompleta = false,
  className,
}: {
  etiqueta?: string;
  pantallaCompleta?: boolean;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={clsx(
        'flex flex-col items-center justify-center gap-3 text-sm text-gray-600',
        pantallaCompleta ? 'min-h-[100svh] bg-gray-50' : 'py-12',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="h-8 w-8 rounded-full border-[3px] border-gray-200 border-t-primary animate-spin"
      />
      <span>{etiqueta}</span>
    </div>
  );
}

/** Estado de error con reintento opcional. Acepta cualquier error (ApiError incluido). */
export function ErrorEstado({
  error,
  titulo,
  onReintentar,
  className,
}: {
  error?: unknown;
  titulo?: string;
  onReintentar?: () => void;
  className?: string;
}) {
  const sinRed = esApiError(error) && error.esRed;
  const Icono = sinRed ? WifiOff : AlertTriangle;
  return (
    <div
      role="alert"
      className={clsx(
        'flex flex-col items-center justify-center gap-3 rounded-lg border border-danger/20 bg-white px-6 py-10 text-center',
        className,
      )}
    >
      <Icono aria-hidden="true" className="h-8 w-8 text-danger" />
      <p className="font-display text-lg font-bold text-ink">
        {titulo ?? (sinRed ? 'Sin conexión con el servidor' : 'No se pudo cargar la información')}
      </p>
      <p className="max-w-md text-sm text-gray-600">{mensajeDeError(error)}</p>
      {onReintentar && (
        <button
          type="button"
          onClick={onReintentar}
          className="mt-1 inline-flex items-center gap-2 rounded-md border border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-primary hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
        >
          <RotateCw aria-hidden="true" className="h-4 w-4" /> Reintentar
        </button>
      )}
    </div>
  );
}

/** Estado vacío (listas sin resultados). */
export function Vacio({
  titulo = 'No hay registros',
  descripcion,
  accion,
  icono,
  className,
}: {
  titulo?: string;
  descripcion?: ReactNode;
  accion?: ReactNode;
  icono?: ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx('flex flex-col items-center justify-center gap-2 px-6 py-12 text-center', className)}>
      <span aria-hidden="true" className="mb-1 text-gray-400">
        {icono ?? <Inbox className="h-9 w-9" />}
      </span>
      <p className="font-display text-base font-bold text-ink">{titulo}</p>
      {descripcion && <p className="max-w-md text-sm text-gray-600">{descripcion}</p>}
      {accion && <div className="mt-3">{accion}</div>}
    </div>
  );
}
