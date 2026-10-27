import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import clsx from 'clsx';

export type VarianteBoton = 'primario' | 'secundario' | 'peligro' | 'fantasma' | 'dorado';
export type TamanoBoton = 'sm' | 'md';

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60';

const VARIANTES: Record<VarianteBoton, string> = {
  primario: 'bg-primary text-white hover:bg-[#0e2c63] shadow-sm',
  secundario: 'border border-gray-300 bg-white text-ink hover:bg-gray-50 hover:border-gray-400',
  peligro: 'bg-danger text-white hover:bg-[#b51f0d] shadow-sm',
  fantasma: 'text-primary hover:bg-primary/10',
  dorado: 'bg-gold text-ink hover:bg-gold-deep shadow-sm',
};

const TAMANOS: Record<TamanoBoton, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-4 text-sm',
};

export function clasesBoton(variante: VarianteBoton = 'primario', tamano: TamanoBoton = 'md', extra?: string) {
  return clsx(BASE, VARIANTES[variante], TAMANOS[tamano], extra);
}

export interface BotonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: VarianteBoton;
  tamano?: TamanoBoton;
  /** Muestra un spinner, deshabilita el botón y marca aria-busy. */
  cargando?: boolean;
  icono?: ReactNode;
}

/** Botón del panel. `type="button"` por defecto. */
export const Boton = forwardRef<HTMLButtonElement, BotonProps>(function Boton(
  { variante = 'primario', tamano = 'md', cargando = false, icono, className, children, disabled, type = 'button', ...resto },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || cargando}
      aria-busy={cargando || undefined}
      className={clasesBoton(variante, tamano, className)}
      {...resto}
    >
      {cargando ? (
        <span aria-hidden="true" className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
      ) : (
        icono
      )}
      {children}
    </button>
  );
});

/** Enlace del router con apariencia de botón. */
export function BotonEnlace({
  variante = 'primario',
  tamano = 'md',
  icono,
  className,
  children,
  ...resto
}: LinkProps & { variante?: VarianteBoton; tamano?: TamanoBoton; icono?: ReactNode }) {
  return (
    <Link className={clasesBoton(variante, tamano, className)} {...resto}>
      {icono}
      {children}
    </Link>
  );
}
