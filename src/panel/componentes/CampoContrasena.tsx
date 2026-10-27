import { useId, useState } from 'react';
import clsx from 'clsx';
import { AlertCircle, Check, Eye, EyeOff } from 'lucide-react';
import type { CampoTextoProps } from './Formulario';

/** Campo de contraseña con botón mostrar/ocultar. Mismas props que `CampoTexto`. */
export function CampoContrasena({
  etiqueta,
  error,
  ayuda,
  requerido,
  className,
  etiquetaOculta,
  id,
  ...input
}: Omit<CampoTextoProps, 'type'>) {
  const auto = useId();
  const cid = id ?? auto;
  const [visible, setVisible] = useState(false);
  const msg = Array.isArray(error) ? error[0] : error;
  return (
    <div className={clsx('space-y-1.5', className)}>
      <label htmlFor={cid} className={clsx('block text-sm font-semibold text-ink', etiquetaOculta && 'sr-only')}>
        {etiqueta}
        {requerido && (
          <span className="ml-0.5 text-danger" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <div className="relative">
        <input
          id={cid}
          type={visible ? 'text' : 'password'}
          required={requerido}
          aria-invalid={msg ? true : undefined}
          aria-describedby={msg ? `${cid}-error` : ayuda ? `${cid}-ayuda` : undefined}
          className={clsx(
            'block h-11 w-full rounded-md border bg-white pl-3 pr-11 text-sm text-ink shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30',
            msg ? 'border-danger' : 'border-gray-300 focus:border-primary',
          )}
          {...input}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center rounded-r-md text-gray-500 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          {visible ? <EyeOff aria-hidden="true" className="h-4 w-4" /> : <Eye aria-hidden="true" className="h-4 w-4" />}
        </button>
      </div>
      {ayuda && !msg && (
        <p id={`${cid}-ayuda`} className="text-xs text-gray-600">
          {ayuda}
        </p>
      )}
      {msg && (
        <p id={`${cid}-error`} className="flex items-center gap-1 text-xs font-medium text-danger">
          <AlertCircle aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
          {msg}
        </p>
      )}
    </div>
  );
}

/** Lista de reglas con check verde cuando se cumplen (medidor de contraseña). */
export function ReglasContrasena({
  valor,
  reglas,
  id,
}: {
  valor: string;
  reglas: ReadonlyArray<{ id: string; texto: string; cumple: (s: string) => boolean }>;
  id?: string;
}) {
  return (
    <ul id={id} className="space-y-1 text-xs" aria-label="Requisitos de la contraseña">
      {reglas.map((r) => {
        const ok = r.cumple(valor);
        return (
          <li key={r.id} className={clsx('flex items-center gap-1.5', ok ? 'text-green-800' : 'text-gray-600')}>
            <span
              aria-hidden="true"
              className={clsx(
                'inline-flex h-4 w-4 items-center justify-center rounded-full border',
                ok ? 'border-success bg-success text-white' : 'border-gray-300',
              )}
            >
              {ok && <Check className="h-3 w-3" />}
            </span>
            {r.texto}
            <span className="sr-only">{ok ? ' (cumplido)' : ' (pendiente)'}</span>
          </li>
        );
      })}
    </ul>
  );
}
