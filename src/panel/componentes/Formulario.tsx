import {
  useId,
  type FormEvent,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import clsx from 'clsx';
import { AlertCircle } from 'lucide-react';
import { esApiError, mensajeDeError, type ErroresCampos } from '../../lib/api';

/** Error de un campo: texto, lista de textos (como `error.campos`) o nada. */
export type ErrorCampo = string | string[] | null | undefined;

function primerError(error: ErrorCampo): string | undefined {
  if (!error) return undefined;
  return Array.isArray(error) ? error[0] : error;
}

/** Primer error del campo `nombre` en un mapa de errores (servidor o cliente). */
export function errorDe(errores: ErroresCampos | Record<string, ErrorCampo> | undefined, nombre: string) {
  return primerError(errores?.[nombre] as ErrorCampo);
}

/** Combina errores del cliente y del servidor (gana el del cliente). */
export function combinarErrores(
  ...fuentes: Array<Record<string, ErrorCampo> | ErroresCampos | undefined>
): Record<string, string> {
  const r: Record<string, string> = {};
  for (const f of fuentes.reverse()) {
    if (!f) continue;
    for (const [k, v] of Object.entries(f)) {
      const e = primerError(v as ErrorCampo);
      if (e) r[k] = e;
    }
  }
  return r;
}

// ── Formulario ──────────────────────────────────────────────────────────────

/**
 * `<form>` con `preventDefault`, `noValidate` y aviso general de error.
 * Si `error` es un ApiError 422 con campos, el aviso dice "Revise los campos
 * marcados" y cada campo pinta su propio error (pásele `errorDe(error.campos, …)`).
 */
export function Formulario({
  onEnviar,
  error,
  children,
  className,
  'aria-label': ariaLabel,
}: {
  onEnviar: (e: FormEvent<HTMLFormElement>) => void;
  error?: unknown;
  children: ReactNode;
  className?: string;
  'aria-label'?: string;
}) {
  return (
    <form
      noValidate
      aria-label={ariaLabel}
      className={clsx('space-y-5', className)}
      onSubmit={(e) => {
        e.preventDefault();
        onEnviar(e);
      }}
    >
      {error ? <AlertaFormulario error={error} /> : null}
      {children}
    </form>
  );
}

/** Aviso de error general del formulario (role=alert). */
export function AlertaFormulario({ error, className }: { error: unknown; className?: string }) {
  const mensaje =
    esApiError(error) && error.status === 422 && Object.keys(error.campos).length > 0 && error.codigo === 'VALIDACION'
      ? 'Revise los campos marcados.'
      : mensajeDeError(error);
  return (
    <div
      role="alert"
      className={clsx(
        'flex items-start gap-2 rounded-md border border-danger/30 bg-red-50 px-3 py-2.5 text-sm text-red-800',
        className,
      )}
    >
      <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{mensaje}</span>
    </div>
  );
}

// ── Campo base ──────────────────────────────────────────────────────────────

interface PropsCampoBase {
  etiqueta: ReactNode;
  error?: ErrorCampo;
  ayuda?: ReactNode;
  requerido?: boolean;
  /** Clases del contenedor. */
  className?: string;
  /** Oculta visualmente la etiqueta (sigue disponible para lectores). */
  etiquetaOculta?: boolean;
}

const CLASE_CONTROL =
  'block w-full rounded-md border bg-white px-3 text-sm text-ink placeholder:text-gray-400 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:bg-gray-100 disabled:text-gray-500';

function claseControl(conError: boolean, extra?: string) {
  return clsx(CLASE_CONTROL, conError ? 'border-danger focus:border-danger' : 'border-gray-300 focus:border-primary', extra);
}

function Envoltura({
  id,
  etiqueta,
  error,
  ayuda,
  requerido,
  className,
  etiquetaOculta,
  extra,
  children,
}: PropsCampoBase & { id: string; extra?: ReactNode; children: ReactNode }) {
  const msg = primerError(error);
  return (
    <div className={clsx('space-y-1.5', className)}>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className={clsx('block text-sm font-semibold text-ink', etiquetaOculta && 'sr-only')}>
          {etiqueta}
          {requerido && (
            <span className="ml-0.5 text-danger" aria-hidden="true">
              *
            </span>
          )}
        </label>
        {extra}
      </div>
      {children}
      {ayuda && !msg && (
        <p id={`${id}-ayuda`} className="text-xs text-gray-600">
          {ayuda}
        </p>
      )}
      {msg && (
        <p id={`${id}-error`} className="flex items-center gap-1 text-xs font-medium text-danger">
          <AlertCircle aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
          {msg}
        </p>
      )}
    </div>
  );
}

function aria(id: string, error: ErrorCampo, ayuda: ReactNode) {
  const msg = primerError(error);
  return {
    'aria-invalid': msg ? true : undefined,
    'aria-describedby': msg ? `${id}-error` : ayuda ? `${id}-ayuda` : undefined,
  } as const;
}

// ── Campos ──────────────────────────────────────────────────────────────────

export type CampoTextoProps = PropsCampoBase & Omit<InputHTMLAttributes<HTMLInputElement>, 'className'>;

/** `<input>` con etiqueta, ayuda y error accesibles. */
export function CampoTexto({ etiqueta, error, ayuda, requerido, className, etiquetaOculta, id, ...input }: CampoTextoProps) {
  const auto = useId();
  const cid = id ?? auto;
  return (
    <Envoltura {...{ id: cid, etiqueta, error, ayuda, requerido, className, etiquetaOculta }}>
      <input
        id={cid}
        required={requerido}
        className={claseControl(!!primerError(error), 'h-11')}
        {...aria(cid, error, ayuda)}
        {...input}
      />
    </Envoltura>
  );
}

export type CampoAreaTextoProps = PropsCampoBase &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> & { contador?: boolean };

/** `<textarea>`; con `contador` y `maxLength` muestra "n / max". */
export function CampoAreaTexto({
  etiqueta,
  error,
  ayuda,
  requerido,
  className,
  etiquetaOculta,
  id,
  contador,
  rows = 4,
  ...area
}: CampoAreaTextoProps) {
  const auto = useId();
  const cid = id ?? auto;
  const largo = typeof area.value === 'string' ? area.value.length : 0;
  const extra =
    contador && area.maxLength ? (
      <span className={clsx('text-xs tabular-nums', largo > area.maxLength ? 'text-danger' : 'text-gray-500')}>
        {largo} / {area.maxLength}
      </span>
    ) : undefined;
  return (
    <Envoltura {...{ id: cid, etiqueta, error, ayuda, requerido, className, etiquetaOculta, extra }}>
      <textarea
        id={cid}
        rows={rows}
        required={requerido}
        className={claseControl(!!primerError(error), 'py-2')}
        {...aria(cid, error, ayuda)}
        {...area}
      />
    </Envoltura>
  );
}

export interface OpcionSelect {
  valor: string | number;
  etiqueta: string;
  deshabilitada?: boolean;
}

export type CampoSelectProps = PropsCampoBase &
  Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className'> & {
    opciones?: OpcionSelect[];
    /** Texto de la opción vacía inicial (value=""). */
    placeholder?: string;
  };

/** `<select>` con opciones declarativas o `children`. */
export function CampoSelect({
  etiqueta,
  error,
  ayuda,
  requerido,
  className,
  etiquetaOculta,
  id,
  opciones,
  placeholder,
  children,
  ...select
}: CampoSelectProps) {
  const auto = useId();
  const cid = id ?? auto;
  return (
    <Envoltura {...{ id: cid, etiqueta, error, ayuda, requerido, className, etiquetaOculta }}>
      <select
        id={cid}
        required={requerido}
        className={claseControl(!!primerError(error), 'h-11 pr-8')}
        {...aria(cid, error, ayuda)}
        {...select}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {opciones?.map((o) => (
          <option key={o.valor} value={o.valor} disabled={o.deshabilitada}>
            {o.etiqueta}
          </option>
        ))}
        {children}
      </select>
    </Envoltura>
  );
}

export type CampoCasillaProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'className'> & {
  etiqueta: ReactNode;
  descripcion?: ReactNode;
  error?: ErrorCampo;
  className?: string;
};

/** Checkbox con etiqueta clicable. */
export function CampoCasilla({ etiqueta, descripcion, error, className, id, ...input }: CampoCasillaProps) {
  const auto = useId();
  const cid = id ?? auto;
  const msg = primerError(error);
  return (
    <div className={clsx('space-y-1', className)}>
      <div className="flex items-start gap-2.5">
        <input
          id={cid}
          type="checkbox"
          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary accent-primary focus:ring-2 focus:ring-primary/30"
          aria-invalid={msg ? true : undefined}
          aria-describedby={msg ? `${cid}-error` : descripcion ? `${cid}-desc` : undefined}
          {...input}
        />
        <div>
          <label htmlFor={cid} className="text-sm font-medium text-ink">
            {etiqueta}
          </label>
          {descripcion && (
            <p id={`${cid}-desc`} className="text-xs text-gray-600">
              {descripcion}
            </p>
          )}
        </div>
      </div>
      {msg && (
        <p id={`${cid}-error`} className="text-xs font-medium text-danger">
          {msg}
        </p>
      )}
    </div>
  );
}

/** Fila de acciones al pie de un formulario. */
export function AccionesFormulario({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx('flex flex-col-reverse gap-2 border-t border-gray-200 pt-4 sm:flex-row sm:justify-end', className)}>
      {children}
    </div>
  );
}
