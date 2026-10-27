import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Copy, FileText, Plus } from 'lucide-react';
import { Boton, BotonEnlace } from '../componentes/Boton';
import { Cargando, ErrorEstado, Vacio } from '../componentes/Estados';
import { CampoSelect } from '../componentes/Formulario';
import { FiltroBarra } from '../componentes/FiltroBarra';
import { EstadoInsignia, Insignia } from '../componentes/Insignia';
import { Paginacion } from '../componentes/Paginacion';
import { PanelPestana, Pestanas, usePestanaUrl } from '../componentes/Pestanas';
import { Tabla, type ColumnaTabla } from '../componentes/Tabla';
import { EncabezadoPagina } from '../componentes/EncabezadoPagina';
import { useToast } from '../componentes/Toast';
import { DialogoConfirmar } from '../componentes/DialogoConfirmar';
import { useCampanas, useDocumentos, useDuplicarCampana } from '../controladores/GestionarDocumentosAdmisionController';
import {
  ETIQUETA_TIPO_DOC,
  TIPOS_DOCUMENTO,
  avisoVigencia,
  formatoFecha,
  type CampanaResumen,
  type DocumentoResumen,
} from '../modelos/documentosAdmision';

const PESTANAS = ['documentos', 'admision'] as const;
const ESTADOS_DOC = ['en_revision', 'vigente', 'historico', 'vencido', 'no_publicado'];
const ETIQ_ESTADO: Record<string, string> = { en_revision: 'En revisión', vigente: 'Vigente', historico: 'Histórico', vencido: 'Vencido', no_publicado: 'No publicado' };

/** `/panel/documentos-admision` (pestañas `?pestana=documentos|admision`; `campanas` también se acepta). */
export default function PaginaGestionarDocumentosAdmision() {
  const [params] = useSearchParams();
  const alias = params.get('pestana') === 'campanas' ? 'admision' : undefined;
  const [pestana, setPestana] = usePestanaUrl(PESTANAS, 'documentos');
  const activa = alias ?? pestana;
  return (
    <>
      <EncabezadoPagina
        titulo="Documentos y admisión"
        descripcion="Documentos oficiales con control de vigencia y campañas del proceso de admisión."
        acciones={
          activa === 'documentos' ? (
            <BotonEnlace to="/panel/documentos/nuevo" icono={<Plus aria-hidden="true" className="h-4 w-4" />}>Nuevo documento</BotonEnlace>
          ) : (
            <BotonEnlace to="/panel/campanas/nueva" icono={<Plus aria-hidden="true" className="h-4 w-4" />}>Nueva campaña</BotonEnlace>
          )
        }
      />
      <Pestanas etiqueta="Secciones" activa={activa} onCambiar={setPestana} idBase="da" pestanas={[{ id: 'documentos', etiqueta: 'Documentos' }, { id: 'admision', etiqueta: 'Admisión' }]} />
      <PanelPestana id="documentos" activa={activa} idBase="da"><ListaDocumentos /></PanelPestana>
      <PanelPestana id="admision" activa={activa} idBase="da"><ListaCampanas /></PanelPestana>
    </>
  );
}

function ListaDocumentos() {
  const [q, setQ] = useState('');
  const [tipo, setTipo] = useState('');
  const [estado, setEstado] = useState('');
  const [pagina, setPagina] = useState(1);
  const consulta = useDocumentos({ q, tipo, estado, pagina });

  const columnas: ColumnaTabla<DocumentoResumen>[] = [
    {
      clave: 'doc',
      encabezado: 'Documento',
      celda: (d) => (
        <Link to={`/panel/documentos/${d.id_documento}`} className="font-semibold text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-gold">
          {ETIQUETA_TIPO_DOC[d.tipo] ?? d.tipo} {d.numero}
          {d.titulo ? <span className="block text-xs font-normal text-gray-600">{d.titulo}</span> : null}
        </Link>
      ),
    },
    { clave: 'estado', encabezado: 'Estado', celda: (d) => <EstadoInsignia estado={d.estado} /> },
    { clave: 'emision', encabezado: 'Emisión', className: 'hidden md:table-cell', celda: (d) => formatoFecha(d.fecha_emision) },
    {
      clave: 'vigencia',
      encabezado: 'Vigencia',
      celda: (d) => {
        const a = d.estado === 'vigente' ? avisoVigencia(d.fecha_vigencia) : null;
        return (
          <span className="flex flex-wrap items-center gap-1.5">
            {formatoFecha(d.fecha_vigencia)}
            {a && <Insignia tono={a.tono}>{a.texto}</Insignia>}
          </span>
        );
      },
    },
    { clave: 'dep', encabezado: 'Emisor', className: 'hidden lg:table-cell', celda: (d) => d.departamento_emisor ?? '—' },
  ];

  return (
    <div className="space-y-4">
      <FiltroBarra busqueda={q} onBusqueda={(v) => { setQ(v); setPagina(1); }} placeholder="Buscar por número o título…">
        <CampoSelect className="w-44" etiqueta="Tipo" placeholder="Todos" value={tipo} onChange={(e) => { setTipo(e.target.value); setPagina(1); }} opciones={TIPOS_DOCUMENTO.map((t) => ({ valor: t.valor, etiqueta: t.etiqueta }))} />
        <CampoSelect className="w-44" etiqueta="Estado" placeholder="Todos" value={estado} onChange={(e) => { setEstado(e.target.value); setPagina(1); }} opciones={ESTADOS_DOC.map((s) => ({ valor: s, etiqueta: ETIQ_ESTADO[s] }))} />
      </FiltroBarra>
      <Tabla
        titulo="Documentos oficiales"
        columnas={columnas}
        filas={consulta.data?.data}
        claveFila={(d) => d.id_documento}
        cargando={consulta.isPending}
        error={consulta.error}
        onReintentar={() => void consulta.refetch()}
        vacio={<Vacio icono={<FileText className="h-9 w-9" />} titulo="No hay documentos" descripcion="Ningún documento coincide con los filtros." />}
      />
      <Paginacion meta={consulta.data?.meta} onCambiar={setPagina} />
    </div>
  );
}

function ListaCampanas() {
  const navegar = useNavigate();
  const toast = useToast();
  const consulta = useCampanas();
  const duplicar = useDuplicarCampana();
  const [aDuplicar, setADuplicar] = useState<CampanaResumen | null>(null);

  if (consulta.isPending) return <Cargando etiqueta="Cargando campañas…" />;
  if (consulta.isError) return <ErrorEstado error={consulta.error} onReintentar={() => void consulta.refetch()} />;
  const lista = [...consulta.data].sort((a, b) => b.anio - a.anio || (b.proceso ?? '').localeCompare(a.proceso ?? ''));
  const vigente = lista.find((c) => c.estado === 'vigente');
  const resto = lista.filter((c) => c !== vigente);

  const columnas: ColumnaTabla<CampanaResumen>[] = [
    {
      clave: 'c',
      encabezado: 'Campaña',
      celda: (c) => (
        <Link to={`/panel/campanas/${c.id_campana}`} className="font-semibold text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-gold">
          {c.anio} · {c.proceso ?? 'sin proceso'}
        </Link>
      ),
    },
    { clave: 'estado', encabezado: 'Estado', celda: (c) => <EstadoInsignia estado={c.estado} /> },
    { clave: 'fechas', encabezado: 'Periodo', celda: (c) => `${formatoFecha(c.fecha_inicio)} – ${formatoFecha(c.fecha_fin)}` },
    {
      clave: 'acc',
      encabezado: 'Acciones',
      encabezadoOculto: true,
      alinear: 'derecha',
      celda: (c) => (
        <Boton tamano="sm" variante="fantasma" icono={<Copy aria-hidden="true" className="h-4 w-4" />} onClick={() => { duplicar.reset(); setADuplicar(c); }}>
          Duplicar<span className="sr-only"> campaña {c.anio} {c.proceso}</span>
        </Boton>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {vigente && (
        <section aria-label="Campaña vigente" className="rounded-lg border-2 border-gold bg-gold/10 p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-yellow-900">Campaña vigente</p>
          <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-bold text-ink">{vigente.anio} · {vigente.proceso}</h2>
              <p className="text-sm text-gray-700">{formatoFecha(vigente.fecha_inicio)} – {formatoFecha(vigente.fecha_fin)}</p>
            </div>
            <div className="flex gap-2">
              <BotonEnlace to={`/panel/campanas/${vigente.id_campana}`} variante="secundario" tamano="sm">Ver</BotonEnlace>
              <Boton tamano="sm" variante="dorado" icono={<Copy aria-hidden="true" className="h-4 w-4" />} onClick={() => { duplicar.reset(); setADuplicar(vigente); }}>
                Duplicar para corregir
              </Boton>
            </div>
          </div>
        </section>
      )}
      <Tabla
        titulo="Campañas de admisión"
        columnas={columnas}
        filas={resto}
        claveFila={(c) => c.id_campana}
        vacio={
          <Vacio titulo={vigente ? 'No hay otras campañas' : 'No hay campañas'} descripcion={vigente ? undefined : 'Cree la primera campaña de admisión.'} />
        }
      />
      <DialogoConfirmar
        abierto={!!aDuplicar}
        titulo="Duplicar campaña"
        mensaje={aDuplicar && `Se creará un borrador con la cabecera, modalidades y cronograma de ${aDuplicar.anio} · ${aDuplicar.proceso}. Sirve para corregir una campaña vigente.`}
        textoConfirmar="Duplicar"
        cargando={duplicar.isPending}
        error={duplicar.error}
        onCancelar={() => setADuplicar(null)}
        onConfirmar={() =>
          aDuplicar &&
          duplicar.mutate(aDuplicar.id_campana, {
            onSuccess: (id) => {
              toast.exito('Borrador creado.');
              setADuplicar(null);
              navegar(`/panel/campanas/${id}`);
            },
          })
        }
      />
    </div>
  );
}
