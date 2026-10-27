/**
 * Piezas comunes del flujo de revisión (§2): banner de observaciones, lista de
 * validación, historial y diálogo de decisión del Revisor. Son presentacionales
 * salvo `HistorialRevision`, que consulta `GET /revision/{entidad}/{id}/historial`.
 */
import { useState, type ReactNode } from 'react';
import clsx from 'clsx';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, MessageSquareWarning, XCircle } from 'lucide-react';
import { apiPanel } from '../../lib/api';
import type {
  DecisionRevision,
  EntidadRevisable,
  EntradaHistorial,
  ItemValidacion,
  RespuestaDatos,
} from '../modelos/comunes';
import { etiquetaEstado } from '../modelos/comunes';
import { Modal } from './Modal';
import { Boton } from './Boton';
import { AlertaFormulario, CampoAreaTexto, CampoCasilla } from './Formulario';
import { Cargando, ErrorEstado } from './Estados';
import { EstadoInsignia } from './Insignia';

const formatoFecha = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Lima' });
};

// ── Banner de observaciones ─────────────────────────────────────────────────

/** Muestra las observaciones del Revisor (si hay) sobre el formulario de edición. */
export function BannerObservaciones({
  observaciones,
  fecha,
  titulo = 'Observaciones del revisor',
  className,
}: {
  observaciones: string | null | undefined;
  fecha?: string | null;
  titulo?: string;
  className?: string;
}) {
  if (!observaciones) return null;
  return (
    <div role="note" className={clsx('flex gap-3 rounded-lg border border-gold/60 bg-gold/10 px-4 py-3 text-sm', className)}>
      <MessageSquareWarning aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-gold-deep" />
      <div>
        <p className="font-semibold text-ink">
          {titulo}
          {fecha && <span className="ml-2 font-normal text-gray-600">{formatoFecha(fecha)}</span>}
        </p>
        <p className="mt-1 whitespace-pre-line text-gray-800">{observaciones}</p>
      </div>
    </div>
  );
}

// ── Lista de validación ─────────────────────────────────────────────────────

function GrupoValidacion({ lista, error }: { lista: ItemValidacion[]; error: boolean }) {
  if (!lista.length) return null;
  return (
      <div>
        <h3 className={clsx('mb-2 text-sm font-bold', error ? 'text-red-800' : 'text-yellow-900')}>
          {error ? `Errores (${lista.length})` : `Advertencias (${lista.length})`}
        </h3>
        <ul className="space-y-1.5">
          {lista.map((i, k) => (
            <li
              key={`${i.codigo}-${k}`}
              className={clsx(
                'flex items-start gap-2 rounded-md px-3 py-2 text-sm',
                error ? 'bg-red-50 text-red-900' : 'bg-gold/10 text-yellow-950',
              )}
            >
              {error ? (
                <XCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
              ) : (
                <AlertTriangle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-gold-deep" />
              )}
              <span>{i.mensaje}</span>
            </li>
          ))}
        </ul>
      </div>
  );
}

/** Errores y advertencias de `GET …/validacion`. */
export function ListaValidacion({ items, className }: { items: ItemValidacion[] | undefined; className?: string }) {
  if (!items) return null;
  const errores = items.filter((i) => i.nivel === 'error');
  const avisos = items.filter((i) => i.nivel !== 'error');
  if (!items.length) {
    return (
      <p className={clsx('flex items-center gap-2 rounded-md bg-green-50 px-3 py-2.5 text-sm text-green-800', className)}>
        <CheckCircle2 aria-hidden="true" className="h-4 w-4" /> Sin errores ni advertencias. Puede enviarse a revisión.
      </p>
    );
  }
  return (
    <div className={clsx('space-y-4', className)}>
      <GrupoValidacion lista={errores} error />
      <GrupoValidacion lista={avisos} error={false} />
    </div>
  );
}

// ── Historial de revisión ───────────────────────────────────────────────────

/** Línea de tiempo de transiciones (`historial_revision`) de un registro. */
export function HistorialRevision({
  entidad,
  id,
  className,
}: {
  entidad: EntidadRevisable;
  id: number | string | undefined;
  className?: string;
}) {
  const q = useQuery({
    queryKey: ['panel', 'revision', 'historial', entidad, String(id)],
    queryFn: async () => {
      const r = await apiPanel.get<RespuestaDatos<EntradaHistorial[]> | EntradaHistorial[]>(
        `/revision/${entidad}/${id}/historial`,
      );
      return Array.isArray(r) ? r : (r?.data ?? []);
    },
    enabled: id !== undefined && id !== '' && id !== 'nueva' && id !== 'nuevo',
  });
  if (q.isPending && q.fetchStatus !== 'idle') return <Cargando etiqueta="Cargando historial…" />;
  if (q.isError) return <ErrorEstado error={q.error} onReintentar={() => void q.refetch()} />;
  const entradas = q.data ?? [];
  if (!entradas.length) return <p className="text-sm text-gray-600">Aún no hay movimientos registrados.</p>;
  return (
    <ol className={clsx('relative space-y-4 border-l-2 border-gray-200 pl-5', className)}>
      {entradas.map((e, i) => (
        <li key={i} className="relative">
          <span aria-hidden="true" className="absolute -left-[1.6rem] top-1 h-3 w-3 rounded-full border-2 border-white bg-primary" />
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-semibold capitalize text-ink">{e.accion.replace(/_/g, ' ')}</span>
            {e.estado_anterior && (
              <>
                <EstadoInsignia estado={e.estado_anterior} />
                <span aria-hidden="true">→</span>
                <span className="sr-only">a</span>
              </>
            )}
            <EstadoInsignia estado={e.estado_nuevo} />
          </div>
          <p className="mt-0.5 text-xs text-gray-600">
            {e.usuario} · <time dateTime={e.fecha}>{formatoFecha(e.fecha)}</time>
          </p>
          {e.observaciones && <p className="mt-1 whitespace-pre-line text-sm text-gray-800">{e.observaciones}</p>}
        </li>
      ))}
    </ol>
  );
}

// ── Diálogo de decisión ─────────────────────────────────────────────────────

export interface DatosDecision {
  decision: DecisionRevision;
  observaciones?: string;
  como_vigente?: boolean;
}

const ETIQUETA_DECISION: Record<DecisionRevision, string> = {
  aprobar: 'Aprobar',
  observar: 'Observar',
  descartar: 'Descartar',
};

/**
 * Diálogo del Revisor: aprobar / observar / descartar con observaciones
 * (obligatorias, 5–500, si no es aprobar) y, para planes, "Marcar como versión
 * vigente". `descartar` no se ofrece para docente ni campaña (§2.2).
 * No llama a la API: entrega los datos en `onDecidir` (el controlador hace el POST).
 */
export function DialogoDecision({
  abierto,
  entidad,
  titulo,
  estadoActual,
  operacion,
  onDecidir,
  onCerrar,
  cargando,
  error,
  bloqueado,
  resumen,
}: {
  abierto: boolean;
  entidad: EntidadRevisable;
  titulo: string;
  estadoActual?: string;
  operacion?: string | null;
  onDecidir: (datos: DatosDecision) => void;
  onCerrar: () => void;
  cargando?: boolean;
  error?: unknown;
  /** Motivo por el que no puede decidir (p.ej. "Usted editó este contenido"). */
  bloqueado?: string | null;
  /** Vista previa o diff del registro. */
  resumen?: ReactNode;
}) {
  return (
    <Modal abierto={abierto} onCerrar={() => !cargando && onCerrar()} titulo="Decidir revisión" descripcion={titulo} tamano="lg">
      <FormDecision
        {...{ entidad, estadoActual, operacion, onDecidir, onCerrar, cargando, error, bloqueado, resumen }}
      />
    </Modal>
  );
}

function FormDecision({
  entidad,
  estadoActual,
  operacion,
  onDecidir,
  onCerrar,
  cargando,
  error,
  bloqueado,
  resumen,
}: Omit<Parameters<typeof DialogoDecision>[0], 'abierto' | 'titulo'>) {
  const opciones: DecisionRevision[] =
    entidad === 'docente' || entidad === 'campana' ? ['aprobar', 'observar'] : ['aprobar', 'observar', 'descartar'];
  const [decision, setDecision] = useState<DecisionRevision>('aprobar');
  const [obs, setObs] = useState('');
  const [comoVigente, setComoVigente] = useState(true);
  const [errorObs, setErrorObs] = useState<string | null>(null);

  const enviar = () => {
    const t = obs.trim();
    if (decision !== 'aprobar' && (t.length < 5 || t.length > 500)) {
      setErrorObs('Las observaciones son obligatorias (entre 5 y 500 caracteres).');
      return;
    }
    setErrorObs(null);
    onDecidir({
      decision,
      observaciones: t || undefined,
      ...(entidad === 'plan' && decision === 'aprobar' ? { como_vigente: comoVigente } : {}),
    });
  };

  return (
    <div className="space-y-5">
      {error ? <AlertaFormulario error={error} /> : null}
      {bloqueado && (
        <p role="note" className="rounded-md bg-gold/10 px-3 py-2 text-sm text-yellow-950">
          {bloqueado}
        </p>
      )}
      {estadoActual && (
        <p className="flex items-center gap-2 text-sm text-gray-700">
          Estado actual: <EstadoInsignia estado={estadoActual} operacion={operacion} />
        </p>
      )}
      {resumen}
      <fieldset disabled={!!bloqueado || cargando}>
        <legend className="mb-2 text-sm font-semibold text-ink">Decisión</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {opciones.map((d) => (
            <label
              key={d}
              className={clsx(
                'flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2.5 text-sm font-semibold has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-gold',
                decision === d
                  ? d === 'aprobar'
                    ? 'border-success bg-green-50 text-green-900'
                    : d === 'observar'
                      ? 'border-gold bg-gold/10 text-yellow-950'
                      : 'border-danger bg-red-50 text-red-900'
                  : 'border-gray-300 bg-white text-ink hover:bg-gray-50',
              )}
            >
              <input
                type="radio"
                name="decision"
                value={d}
                checked={decision === d}
                onChange={() => setDecision(d)}
                className="accent-primary"
              />
              {ETIQUETA_DECISION[d]}
            </label>
          ))}
        </div>
      </fieldset>
      {entidad === 'plan' && decision === 'aprobar' && (
        <CampoCasilla
          etiqueta="Marcar como versión vigente"
          descripcion={`Si no se marca, el plan quedará como ${etiquetaEstado('historico').toLowerCase()} (consultable).`}
          checked={comoVigente}
          onChange={(e) => setComoVigente(e.target.checked)}
          disabled={!!bloqueado || cargando}
        />
      )}
      <CampoAreaTexto
        etiqueta={decision === 'aprobar' ? 'Observaciones (opcional)' : 'Observaciones'}
        requerido={decision !== 'aprobar'}
        value={obs}
        onChange={(e) => setObs(e.target.value)}
        maxLength={500}
        contador
        error={errorObs}
        disabled={!!bloqueado || cargando}
      />
      <div className="flex flex-col-reverse gap-2 border-t border-gray-200 pt-4 sm:flex-row sm:justify-end">
        <Boton variante="secundario" onClick={onCerrar} disabled={cargando}>
          Cancelar
        </Boton>
        <Boton
          variante={decision === 'descartar' ? 'peligro' : 'primario'}
          onClick={enviar}
          cargando={cargando}
          disabled={!!bloqueado}
        >
          {ETIQUETA_DECISION[decision]}
        </Boton>
      </div>
    </div>
  );
}
