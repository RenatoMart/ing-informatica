import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import clsx from 'clsx';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { mensajeDeError } from '../../lib/api';

type TipoToast = 'exito' | 'error' | 'info';

interface ToastItem {
  id: number;
  tipo: TipoToast;
  mensaje: ReactNode;
}

export interface ApiToast {
  exito: (mensaje: ReactNode) => void;
  /** Acepta un texto o cualquier error (se usa su mensaje). */
  error: (mensajeOError: unknown) => void;
  info: (mensaje: ReactNode) => void;
}

const ToastContext = createContext<ApiToast | null>(null);

const ESTILOS: Record<TipoToast, { clase: string; Icono: typeof Info }> = {
  exito: { clase: 'border-l-success', Icono: CheckCircle2 },
  error: { clase: 'border-l-danger', Icono: AlertCircle },
  info: { clase: 'border-l-primary', Icono: Info },
};
const COLOR_ICONO: Record<TipoToast, string> = { exito: 'text-success', error: 'text-danger', info: 'text-primary' };

/** Proveedor de avisos flotantes (lo monta PanelApp). */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const sec = useRef(0);

  const cerrar = useCallback((id: number) => setItems((xs) => xs.filter((x) => x.id !== id)), []);

  const mostrar = useCallback(
    (tipo: TipoToast, mensaje: ReactNode) => {
      const id = ++sec.current;
      setItems((xs) => [...xs.slice(-3), { id, tipo, mensaje }]);
      window.setTimeout(() => cerrar(id), tipo === 'error' ? 8000 : 4500);
    },
    [cerrar],
  );

  const api = useMemo<ApiToast>(
    () => ({
      exito: (m) => mostrar('exito', m),
      info: (m) => mostrar('info', m),
      error: (e) =>
        mostrar('error', typeof e === 'string' || (typeof e === 'object' && e !== null && 'props' in e) ? (e as ReactNode) : mensajeDeError(e)),
    }),
    [mostrar],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[120] flex flex-col items-center gap-2 p-4 sm:items-end">
        {/* Regiones vivas separadas: los errores se anuncian con prioridad. */}
        <div role="status" aria-live="polite" className="flex w-full flex-col items-center gap-2 sm:items-end">
          {items.filter((t) => t.tipo !== 'error').map((t) => (
            <TarjetaToast key={t.id} item={t} onCerrar={cerrar} />
          ))}
        </div>
        <div role="alert" aria-live="assertive" className="flex w-full flex-col items-center gap-2 sm:items-end">
          {items.filter((t) => t.tipo === 'error').map((t) => (
            <TarjetaToast key={t.id} item={t} onCerrar={cerrar} />
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
}

function TarjetaToast({ item, onCerrar }: { item: ToastItem; onCerrar: (id: number) => void }) {
  const { clase, Icono } = ESTILOS[item.tipo];
  return (
    <div
      className={clsx(
        'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border border-gray-200 border-l-4 bg-white px-4 py-3 text-sm text-ink shadow-lg',
        clase,
      )}
    >
      <Icono aria-hidden="true" className={clsx('mt-0.5 h-5 w-5 shrink-0', COLOR_ICONO[item.tipo])} />
      <div className="flex-1">{item.mensaje}</div>
      <button
        type="button"
        onClick={() => onCerrar(item.id)}
        aria-label="Cerrar aviso"
        className="-mr-1 inline-flex h-7 w-7 items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
      >
        <X aria-hidden="true" className="h-4 w-4" />
      </button>
    </div>
  );
}

/** `const toast = useToast(); toast.exito('Guardado');  toast.error(err);` */
export function useToast(): ApiToast {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de <ToastProvider>.');
  return ctx;
}
