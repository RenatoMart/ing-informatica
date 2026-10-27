import type { Key, ReactNode } from 'react';
import clsx from 'clsx';
import { Cargando, ErrorEstado, Vacio } from './Estados';

export interface ColumnaTabla<T> {
  /** Identificador único de la columna. */
  clave: string;
  encabezado: ReactNode;
  /** Contenido de la celda. Si se omite, se usa `fila[clave]`. */
  celda?: (fila: T, indice: number) => ReactNode;
  /** Alineación del contenido. */
  alinear?: 'izquierda' | 'centro' | 'derecha';
  /** Clases extra de `<th>` y `<td>` (p.ej. `w-32`, `hidden md:table-cell`). */
  className?: string;
  /** Cabecera solo para lectores de pantalla (columna de acciones). */
  encabezadoOculto?: boolean;
}

export interface TablaProps<T> {
  columnas: ColumnaTabla<T>[];
  filas: T[] | undefined;
  /** Clave React de cada fila. */
  claveFila: (fila: T) => Key;
  /** Título accesible de la tabla (se renderiza como caption oculto). */
  titulo: string;
  cargando?: boolean;
  error?: unknown;
  onReintentar?: () => void;
  /** Contenido si no hay filas (por defecto, `<Vacio/>`). */
  vacio?: ReactNode;
  /** Resalta la fila (p.ej. vencidas). */
  claseFila?: (fila: T) => string | undefined;
  className?: string;
}

const ALINEAR = { izquierda: 'text-left', centro: 'text-center', derecha: 'text-right' } as const;

/**
 * Tabla de datos con estados de carga, error y vacío. En pantallas pequeñas
 * hace scroll horizontal dentro de su contenedor (nunca la página).
 * Para filas clicables, ponga un `<Link>` en la celda principal (accesible por teclado).
 */
export function Tabla<T>({
  columnas,
  filas,
  claveFila,
  titulo,
  cargando,
  error,
  onReintentar,
  vacio,
  claseFila,
  className,
}: TablaProps<T>) {
  if (error && !filas?.length) {
    return <ErrorEstado error={error} onReintentar={onReintentar} className={className} />;
  }
  return (
    <div className={clsx('overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm', className)}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm" aria-busy={cargando || undefined}>
          <caption className="sr-only">{titulo}</caption>
          <thead className="bg-gray-50">
            <tr>
              {columnas.map((c) => (
                <th
                  key={c.clave}
                  scope="col"
                  className={clsx(
                    'whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wide text-gray-600',
                    ALINEAR[c.alinear ?? 'izquierda'],
                    c.className,
                  )}
                >
                  {c.encabezadoOculto ? <span className="sr-only">{c.encabezado}</span> : c.encabezado}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filas?.map((fila, i) => (
              <tr key={claveFila(fila)} className={clsx('hover:bg-gray-50/70', claseFila?.(fila))}>
                {columnas.map((c) => (
                  <td
                    key={c.clave}
                    className={clsx('px-4 py-3 align-middle text-ink', ALINEAR[c.alinear ?? 'izquierda'], c.className)}
                  >
                    {c.celda ? c.celda(fila, i) : String((fila as Record<string, unknown>)[c.clave] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {cargando && !filas?.length && <Cargando />}
      {!cargando && filas && filas.length === 0 && (vacio ?? <Vacio />)}
    </div>
  );
}

export default Tabla;
