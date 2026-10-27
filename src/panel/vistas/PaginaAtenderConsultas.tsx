import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { erroresDeCampos } from '../../lib/api';
import {
  AccionesFormulario,
  Boton,
  CampoAreaTexto,
  CampoCasilla,
  CampoSelect,
  Cargando,
  EncabezadoPagina,
  ErrorEstado,
  EstadoInsignia,
  FiltroBarra,
  Formulario,
  Modal,
  Paginacion,
  Pestanas,
  Tabla,
  errorDe,
  useToast,
  type ColumnaTabla,
} from '../componentes';
import {
  useAccionesConsulta,
  useConsulta,
  useConsultas,
  useDepartamentos,
  validarClasificacion,
  validarRespuesta,
} from '../controladores/AtenderConsultasController';
import type { ConsultaFila, DestinoClasificacion } from '../modelos/consultas';

const fechaHora = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' }) : '—';

const ESTADOS = [
  { id: 'todas', etiqueta: 'Todas' },
  { id: 'recibida', etiqueta: 'Recibidas' },
  { id: 'en_atencion', etiqueta: 'En atención' },
  { id: 'atendida', etiqueta: 'Atendidas' },
  { id: 'derivada', etiqueta: 'Derivadas' },
  { id: 'descartada', etiqueta: 'Descartadas' },
];

/** `/panel/consultas` — bandeja por estado; clasificar, derivar, responder o descartar. */
export default function PaginaAtenderConsultas() {
  const [params] = useSearchParams();
  const [estado, setEstado] = useState('todas');
  const [vencidas, setVencidas] = useState(params.get('vencidas') === '1');
  const [q, setQ] = useState('');
  const [pagina, setPagina] = useState(1);
  const [abierta, setAbierta] = useState<number | null>(null);
  const consulta = useConsultas({ estado: estado === 'todas' ? '' : estado, vencidas: vencidas || undefined, q, pagina });

  const columnas: ColumnaTabla<ConsultaFila>[] = [
    {
      clave: 'asunto',
      encabezado: 'Consulta',
      celda: (c) => (
        <div>
          <button type="button" onClick={() => setAbierta(c.id_consulta)} className="text-left font-semibold text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-gold">
            {c.asunto}
          </button>
          <p className="text-xs text-gray-500">{c.nombre} · {c.correo}</p>
        </div>
      ),
    },
    {
      clave: 'estado',
      encabezado: 'Estado',
      celda: (c) => (
        <span className="inline-flex flex-wrap items-center gap-1">
          <EstadoInsignia estado={c.estado} />
          {c.vencida && <span className="rounded-full bg-danger px-2 py-0.5 text-xs font-semibold text-white">Vencida</span>}
        </span>
      ),
    },
    { clave: 'fecha', encabezado: 'Recibida', className: 'hidden md:table-cell', celda: (c) => fechaHora(c.fecha_recepcion) },
    { clave: 'dias', encabezado: 'Días hábiles', className: 'hidden md:table-cell', alinear: 'centro', celda: (c) => c.dias_habiles },
    {
      clave: 'acciones',
      encabezado: 'Acciones',
      encabezadoOculto: true,
      alinear: 'derecha',
      celda: (c) => (
        <Boton tamano="sm" variante="secundario" icono={<Eye className="h-4 w-4" />} onClick={() => setAbierta(c.id_consulta)}>
          Abrir<span className="sr-only"> consulta: {c.asunto}</span>
        </Boton>
      ),
    },
  ];

  return (
    <>
      <EncabezadoPagina titulo="Consultas" descripcion="Consultas del formulario de contacto. Plazos: clasificar en 2 días hábiles y responder en 5." />
      <Pestanas
        etiqueta="Estado de las consultas"
        activa={estado}
        onCambiar={(id) => {
          setEstado(id);
          setPagina(1);
        }}
        pestanas={ESTADOS}
      />
      <div className="space-y-4 pt-5">
        <FiltroBarra
          busqueda={q}
          onBusqueda={(v) => {
            setQ(v);
            setPagina(1);
          }}
          placeholder="Buscar por asunto, nombre o correo"
        >
          <CampoCasilla
            etiqueta="Solo vencidas"
            checked={vencidas}
            onChange={(e) => {
              setVencidas(e.target.checked);
              setPagina(1);
            }}
          />
        </FiltroBarra>
        <Tabla
          titulo="Consultas de contacto"
          columnas={columnas}
          filas={consulta.data?.data}
          claveFila={(c) => c.id_consulta}
          claseFila={(c) => (c.vencida ? 'bg-red-50/60' : undefined)}
          cargando={consulta.isLoading}
          error={consulta.error}
          onReintentar={() => void consulta.refetch()}
        />
        <Paginacion meta={consulta.data?.meta} onCambiar={setPagina} />
      </div>
      {abierta !== null && <DetalleConsulta id={abierta} onCerrar={() => setAbierta(null)} />}
    </>
  );
}

function DetalleConsulta({ id, onCerrar }: { id: number; onCerrar: () => void }) {
  const q = useConsulta(id);
  const c = q.data;
  return (
    <Modal abierto onCerrar={onCerrar} titulo={c ? c.asunto : 'Consulta'} descripcion={c ? `${c.nombre} · ${c.correo}` : undefined} tamano="lg">
      {q.isLoading && <Cargando etiqueta="Cargando consulta…" />}
      {q.isError && <ErrorEstado error={q.error} onReintentar={() => void q.refetch()} />}
      {c && (
        <div className="space-y-5 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <EstadoInsignia estado={c.estado} />
            {c.vencida && <span className="rounded-full bg-danger px-2 py-0.5 text-xs font-semibold text-white">Plazo vencido</span>}
            <span className="text-gray-600">Recibida: {fechaHora(c.fecha_recepcion)} · {c.dias_habiles} día(s) hábil(es)</span>
          </div>
          <p className="whitespace-pre-line rounded-md border border-gray-200 bg-gray-50 p-3 text-ink">{c.mensaje}</p>
          {c.departamento && <p><span className="font-semibold">Área responsable:</span> {c.departamento}</p>}
          {c.respuesta && (
            <div>
              <p className="font-semibold text-ink">{c.estado === 'derivada' ? 'Canal indicado al visitante' : 'Respuesta enviada'} ({fechaHora(c.fecha_respuesta)})</p>
              <p className="mt-1 whitespace-pre-line text-gray-800">{c.respuesta}</p>
            </div>
          )}
          {c.estado === 'recibida' && <FormClasificar id={c.id_consulta} onListo={onCerrar} />}
          {c.estado === 'en_atencion' && <FormResponder id={c.id_consulta} onListo={onCerrar} />}
          {!['recibida', 'en_atencion'].includes(c.estado) && (
            <div className="flex justify-end"><Boton variante="secundario" onClick={onCerrar}>Cerrar</Boton></div>
          )}
        </div>
      )}
    </Modal>
  );
}

function FormClasificar({ id, onListo }: { id: number; onListo: () => void }) {
  const toast = useToast();
  const { clasificar } = useAccionesConsulta();
  const deptos = useDepartamentos(true);
  const [destino, setDestino] = useState<DestinoClasificacion | ''>('');
  const [dep, setDep] = useState('');
  const [nota, setNota] = useState('');
  const [local, setLocal] = useState<Record<string, string>>({});
  const srv = erroresDeCampos(clasificar.error);

  const enviar = () => {
    const e = validarClasificacion({ destino, id_departamento: dep, nota });
    setLocal(e);
    if (Object.keys(e).length) return;
    clasificar
      .mutateAsync({
        id,
        datos: {
          destino: destino as DestinoClasificacion,
          id_departamento: destino === 'area' ? Number(dep) : undefined,
          nota: nota.trim() || undefined,
        },
      })
      .then(() => {
        toast.exito(destino === 'area' ? 'Consulta asignada al área.' : destino === 'externa' ? 'Consulta derivada; se avisó al visitante por correo.' : 'Consulta descartada.');
        onListo();
      })
      .catch(() => undefined);
  };

  return (
    <Formulario onEnviar={enviar} error={clasificar.error} aria-label="Clasificar consulta" className="space-y-4 border-t border-gray-200 pt-4">
      <h3 className="font-display text-base font-bold text-ink">Clasificar consulta</h3>
      <CampoSelect
        etiqueta="Destino"
        requerido
        value={destino}
        onChange={(e) => setDestino(e.target.value as DestinoClasificacion)}
        placeholder="Seleccione"
        opciones={[
          { valor: 'area', etiqueta: 'Atender en un área de la escuela' },
          { valor: 'externa', etiqueta: 'Derivar a un canal externo' },
          { valor: 'descartar', etiqueta: 'Descartar (spam o sin sentido)' },
        ]}
        error={local.destino ?? errorDe(srv, 'destino')}
      />
      {destino === 'area' && (
        <CampoSelect
          etiqueta="Departamento responsable"
          requerido
          value={dep}
          onChange={(e) => setDep(e.target.value)}
          placeholder={deptos.isLoading ? 'Cargando…' : 'Seleccione'}
          opciones={(deptos.data ?? []).map((d) => ({ valor: d.id_departamento, etiqueta: d.nombre }))}
          error={local.id_departamento ?? errorDe(srv, 'id_departamento')}
        />
      )}
      {destino !== 'descartar' && destino !== '' && (
        <CampoAreaTexto
          etiqueta={destino === 'externa' ? 'Nota para el visitante (canal adecuado)' : 'Nota interna'}
          requerido={destino === 'externa'}
          maxLength={1000}
          contador
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          error={local.nota ?? errorDe(srv, 'nota')}
        />
      )}
      {destino === 'descartar' && <p className="text-sm text-gray-700">La consulta quedará descartada y no se enviará ninguna respuesta.</p>}
      <AccionesFormulario>
        <Boton type="submit" variante={destino === 'descartar' ? 'peligro' : 'primario'} cargando={clasificar.isPending}>
          {destino === 'descartar' ? 'Descartar consulta' : destino === 'externa' ? 'Derivar consulta' : 'Clasificar'}
        </Boton>
      </AccionesFormulario>
    </Formulario>
  );
}

function FormResponder({ id, onListo }: { id: number; onListo: () => void }) {
  const toast = useToast();
  const { responder } = useAccionesConsulta();
  const [texto, setTexto] = useState('');
  const [local, setLocal] = useState<string | null>(null);
  const srv = erroresDeCampos(responder.error);
  const enviar = () => {
    const e = validarRespuesta(texto);
    setLocal(e);
    if (e) return;
    responder
      .mutateAsync({ id, respuesta: texto.trim() })
      .then(() => {
        toast.exito('Respuesta enviada al visitante.');
        onListo();
      })
      .catch(() => undefined);
  };
  return (
    <Formulario onEnviar={enviar} error={responder.error} aria-label="Responder consulta" className="space-y-4 border-t border-gray-200 pt-4">
      <h3 className="font-display text-base font-bold text-ink">Responder</h3>
      <CampoAreaTexto etiqueta="Respuesta" requerido rows={6} contador maxLength={5000} value={texto} onChange={(e) => setTexto(e.target.value)} error={local ?? errorDe(srv, 'respuesta')} ayuda="Se enviará por correo al visitante." />
      <AccionesFormulario>
        <Boton type="submit" cargando={responder.isPending}>Enviar respuesta</Boton>
      </AccionesFormulario>
    </Formulario>
  );
}
