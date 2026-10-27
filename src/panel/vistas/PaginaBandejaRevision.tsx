import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Eye } from 'lucide-react';
import {
  Boton,
  Cargando,
  DialogoDecision,
  EncabezadoPagina,
  ErrorEstado,
  EstadoInsignia,
  HistorialRevision,
  Pestanas,
  Tabla,
  useToast,
  type ColumnaTabla,
  type DatosDecision,
} from '../componentes';
import { contarPorEntidad, useDecidirRevision, useDetalleRegistro, useMotivoBloqueo, usePendientesRevision } from '../controladores/RevisionController';
import { ETIQUETA_ENTIDAD, ETIQUETA_OPERACION, type EntidadRevisable, type PendienteRevision } from '../modelos/comunes';
import { ENTIDADES_ORDEN, RUTA_PANTALLA, type DetalleRegistro } from '../modelos/revision';

const clave = (p: PendienteRevision) => `${p.entidad}-${p.id_registro}`;

const humanizar = (k: string) => k.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
const OCULTOS = new Set(['cambios_pendientes', 'operacion_pendiente', 'observaciones_revision', 'archivos', 'especialidades']);

function valorLegible(v: unknown): string | null {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'boolean') return v ? 'Sí' : 'No';
  if (typeof v === 'number' || typeof v === 'string') return String(v);
  if (Array.isArray(v)) return v.every((x) => typeof x !== 'object') ? v.join(', ') || '—' : `${v.length} elemento(s)`;
  return null;
}

/** Vista previa del registro y, si hay `cambios_pendientes`, diff campo a campo. */
function VistaPrevia({ p }: { p: PendienteRevision }) {
  const q = useDetalleRegistro(p.entidad, p.id_registro);
  if (q.isLoading) return <Cargando etiqueta="Cargando detalle…" className="py-6" />;
  if (q.isError) return <ErrorEstado error={q.error} onReintentar={() => void q.refetch()} titulo="No se pudo cargar el detalle" />;
  const d: DetalleRegistro = q.data ?? {};
  const cambios = d.cambios_pendientes && typeof d.cambios_pendientes === 'object' ? d.cambios_pendientes : null;
  const campos = Object.entries(d)
    .filter(([k]) => !OCULTOS.has(k) && !k.startsWith('id_') && !k.endsWith('_url'))
    .map(([k, v]) => [k, valorLegible(v)] as const)
    .filter(([, v]) => v !== null);
  const diff = cambios
    ? Object.entries(cambios).filter(([k]) => !k.startsWith('_')).map(([k, nuevo]) => ({ k, antes: valorLegible(d[k]) ?? '—', despues: valorLegible(nuevo) ?? '(modificado)' }))
    : [];

  return (
    <div className="space-y-4 text-sm">
      {diff.length > 0 && (
        <section aria-label="Cambios propuestos">
          <h3 className="mb-2 font-display text-sm font-bold text-ink">Cambios propuestos</h3>
          <div className="overflow-x-auto rounded-md border border-gray-200">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Comparación campo a campo</caption>
              <thead className="bg-gray-50 text-xs uppercase text-gray-600">
                <tr><th scope="col" className="px-3 py-2">Campo</th><th scope="col" className="px-3 py-2">Actual</th><th scope="col" className="px-3 py-2">Propuesto</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {diff.map((f) => (
                  <tr key={f.k}>
                    <th scope="row" className="px-3 py-2 font-semibold text-ink">{humanizar(f.k)}</th>
                    <td className="whitespace-pre-line bg-red-50/50 px-3 py-2 text-gray-700">{f.antes}</td>
                    <td className="whitespace-pre-line bg-green-50/60 px-3 py-2 text-gray-900">{f.despues}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      <section aria-label="Datos del registro">
        <h3 className="mb-2 font-display text-sm font-bold text-ink">Datos del registro</h3>
        {campos.length === 0 ? (
          <p className="text-gray-600">No hay datos para mostrar.</p>
        ) : (
          <dl className="grid max-h-64 gap-x-4 gap-y-2 overflow-y-auto rounded-md border border-gray-200 p-3 sm:grid-cols-[10rem_1fr]">
            {campos.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="font-semibold text-gray-600">{humanizar(k)}</dt>
                <dd className="whitespace-pre-line break-words text-ink">{v}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>
      <section aria-label="Historial de revisión">
        <h3 className="mb-2 font-display text-sm font-bold text-ink">Historial</h3>
        <HistorialRevision entidad={p.entidad} id={p.id_registro} />
      </section>
    </div>
  );
}

/** `/panel/revision` (Revisor) — pendientes por entidad; decide con `DialogoDecision`. */
export default function PaginaBandejaRevision() {
  const toast = useToast();
  const q = usePendientesRevision();
  const decidir = useDecidirRevision();
  const [pestana, setPestana] = useState<'todos' | EntidadRevisable>('todos');
  const [sel, setSel] = useState<PendienteRevision | null>(null);
  const bloqueo = useMotivoBloqueo(sel);
  const conteo = useMemo(() => contarPorEntidad(q.data), [q.data]);
  const filas = useMemo(() => (q.data ?? []).filter((p) => pestana === 'todos' || p.entidad === pestana), [q.data, pestana]);

  const cerrar = () => {
    setSel(null);
    decidir.reset();
  };

  const enviar = (d: DatosDecision) => {
    if (!sel) return;
    decidir
      .mutateAsync({ entidad: sel.entidad, id: sel.id_registro, ...d })
      .then(() => {
        toast.exito(d.decision === 'aprobar' ? 'Contenido aprobado.' : d.decision === 'observar' ? 'Se devolvió con observaciones al editor.' : 'Contenido descartado.');
        cerrar();
      })
      .catch(() => undefined);
  };

  const columnas: ColumnaTabla<PendienteRevision>[] = [
    {
      clave: 'titulo',
      encabezado: 'Contenido',
      celda: (p) => (
        <button type="button" onClick={() => setSel(p)} className="text-left font-semibold text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-gold">
          {p.titulo}
        </button>
      ),
    },
    { clave: 'entidad', encabezado: 'Tipo', celda: (p) => ETIQUETA_ENTIDAD[p.entidad] },
    {
      clave: 'operacion',
      encabezado: 'Operación',
      celda: (p) => (p.operacion ? <EstadoInsignia estado="en_revision" operacion={p.operacion} /> : <span className="text-gray-600">{ETIQUETA_OPERACION.nuevo ?? 'Alta o publicación'}</span>),
    },
    { clave: 'editor', encabezado: 'Editor', className: 'hidden md:table-cell', celda: (p) => p.editor },
    {
      clave: 'acciones',
      encabezado: 'Acciones',
      encabezadoOculto: true,
      alinear: 'derecha',
      celda: (p) => (
        <Boton tamano="sm" variante="secundario" icono={<Eye className="h-4 w-4" />} onClick={() => setSel(p)}>
          Revisar<span className="sr-only">: {p.titulo}</span>
        </Boton>
      ),
    },
  ];

  return (
    <>
      <EncabezadoPagina titulo="Bandeja de revisión" descripcion="Contenido enviado por los editores a la espera de su decisión. No puede decidir sobre lo que usted mismo editó." />
      <Pestanas
        etiqueta="Filtrar pendientes por tipo"
        activa={pestana}
        onCambiar={(id) => setPestana(id as typeof pestana)}
        pestanas={[
          { id: 'todos', etiqueta: 'Todos', contador: q.data?.length ?? 0 },
          ...ENTIDADES_ORDEN.map((e) => ({ id: e, etiqueta: ETIQUETA_ENTIDAD[e], contador: conteo[e] })),
        ]}
      />
      <div className="pt-5">
        <Tabla
          titulo="Pendientes de revisión"
          columnas={columnas}
          filas={filas}
          claveFila={clave}
          cargando={q.isLoading}
          error={q.error}
          onReintentar={() => void q.refetch()}
        />
      </div>

      {sel && (
        <DialogoDecision
          abierto
          entidad={sel.entidad}
          titulo={`${ETIQUETA_ENTIDAD[sel.entidad]}: ${sel.titulo}`}
          estadoActual="en_revision"
          operacion={sel.operacion}
          onDecidir={enviar}
          onCerrar={cerrar}
          cargando={decidir.isPending}
          error={decidir.error}
          bloqueado={bloqueo}
          resumen={
            <div className="space-y-3">
              <Link to={`${RUTA_PANTALLA[sel.entidad]}/${sel.id_registro}`} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                Abrir el detalle completo <ExternalLink aria-hidden="true" className="h-4 w-4" />
              </Link>
              <VistaPrevia p={sel} />
            </div>
          }
        />
      )}
    </>
  );
}
