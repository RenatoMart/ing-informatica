import { useEffect, useId, useRef, type ReactNode } from 'react';
import clsx from 'clsx';
import { X } from 'lucide-react';

const TAMANOS = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
} as const;

export interface ModalProps {
  abierto: boolean;
  onCerrar: () => void;
  titulo: ReactNode;
  descripcion?: ReactNode;
  children?: ReactNode;
  /** Botones del pie (alineados a la derecha). */
  pie?: ReactNode;
  tamano?: keyof typeof TAMANOS;
  /** Cerrar al hacer clic fuera del cuadro (por defecto true). */
  cerrarConFondo?: boolean;
}

/**
 * Diálogo modal basado en `<dialog>` nativo: atrapa el foco, cierra con Esc,
 * devuelve el foco al disparador y marca el resto como inerte.
 * El contenido solo se monta mientras está abierto (su estado se reinicia).
 */
export function Modal({
  abierto,
  onCerrar,
  titulo,
  descripcion,
  children,
  pie,
  tamano = 'md',
  cerrarConFondo = true,
}: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const idTitulo = useId();
  const idDesc = useId();
  const onCerrarRef = useRef(onCerrar);
  useEffect(() => {
    onCerrarRef.current = onCerrar;
  }, [onCerrar]);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (abierto && !d.open) d.showModal();
    else if (!abierto && d.open) d.close();
    if (!abierto) return;
    // Bloquea el scroll del fondo mientras está abierto.
    const previo = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previo;
    };
  }, [abierto]);

  // Clic en el fondo (::backdrop) → el target es el propio <dialog>.
  useEffect(() => {
    const d = ref.current;
    if (!d || !cerrarConFondo) return;
    const alClic = (e: MouseEvent) => {
      if (e.target === d) onCerrarRef.current();
    };
    d.addEventListener('click', alClic);
    return () => d.removeEventListener('click', alClic);
  }, [cerrarConFondo]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={idTitulo}
      aria-describedby={descripcion ? idDesc : undefined}
      onCancel={(e) => {
        e.preventDefault();
        onCerrar();
      }}
      className={clsx(
        'w-[calc(100%-2rem)] rounded-xl bg-white p-0 text-ink shadow-2xl backdrop:bg-ink/50 backdrop:backdrop-blur-[2px]',
        TAMANOS[tamano],
      )}
    >
      {abierto && (
        <div className="flex max-h-[90dvh] flex-col">
          <header className="flex items-start justify-between gap-4 border-b border-gray-200 px-5 py-4">
            <div>
              <h2 id={idTitulo} className="font-display text-lg font-bold text-primary">
                {titulo}
              </h2>
              {descripcion && (
                <p id={idDesc} className="mt-1 text-sm text-gray-600">
                  {descripcion}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onCerrar}
              aria-label="Cerrar"
              className="-mr-2 -mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              <X aria-hidden="true" className="h-5 w-5" />
            </button>
          </header>
          {children && <div className="overflow-y-auto overscroll-contain px-5 py-4">{children}</div>}
          {pie && (
            <footer className="flex flex-col-reverse gap-2 border-t border-gray-200 bg-gray-50 px-5 py-3 sm:flex-row sm:justify-end">
              {pie}
            </footer>
          )}
        </div>
      )}
    </dialog>
  );
}
