import type { ReactNode } from 'react';
import clsx from 'clsx';
import {
  ETIQUETA_OPERACION,
  etiquetaEstado,
  tonoEstado,
  type TonoInsignia,
} from '../modelos/comunes';

const TONOS: Record<TonoInsignia, string> = {
  neutro: 'bg-gray-100 text-gray-700 ring-gray-300',
  info: 'bg-sky-50 text-sky-800 ring-sky-200',
  aviso: 'bg-gold/15 text-yellow-900 ring-gold/50',
  exito: 'bg-green-50 text-green-800 ring-green-200',
  peligro: 'bg-red-50 text-red-800 ring-red-200',
  primario: 'bg-primary/10 text-primary ring-primary/20',
  apagado: 'bg-gray-50 text-gray-500 ring-gray-200',
};

const PUNTOS: Record<TonoInsignia, string> = {
  neutro: 'bg-gray-400',
  info: 'bg-sky-500',
  aviso: 'bg-gold',
  exito: 'bg-success',
  peligro: 'bg-danger',
  primario: 'bg-primary',
  apagado: 'bg-gray-300',
};

/** Píldora de texto con tono semántico. */
export function Insignia({
  tono = 'neutro',
  children,
  className,
  punto = true,
}: {
  tono?: TonoInsignia;
  children: ReactNode;
  className?: string;
  punto?: boolean;
}) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset',
        TONOS[tono],
        className,
      )}
    >
      {punto && <span aria-hidden="true" className={clsx('h-1.5 w-1.5 rounded-full', PUNTOS[tono])} />}
      {children}
    </span>
  );
}

/**
 * Estado de revisión (o de consulta/usuario/solicitud) con su color.
 * Si hay `operacion` (cambio/baja pendiente) se añade una segunda insignia.
 */
export function EstadoInsignia({
  estado,
  operacion,
  className,
}: {
  estado: string;
  operacion?: string | null;
  className?: string;
}) {
  return (
    <span className={clsx('inline-flex flex-wrap items-center gap-1', className)}>
      <Insignia tono={tonoEstado(estado)}>{etiquetaEstado(estado)}</Insignia>
      {operacion && (
        <Insignia tono="aviso" punto={false}>
          {ETIQUETA_OPERACION[operacion] ?? operacion}
        </Insignia>
      )}
    </span>
  );
}
