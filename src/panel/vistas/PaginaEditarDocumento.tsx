import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Send } from 'lucide-react';
import { erroresDeCampos } from '../../lib/api';
import { Boton } from '../componentes/Boton';
import { EncabezadoPagina, Tarjeta } from '../componentes/EncabezadoPagina';
import { Cargando, ErrorEstado } from '../componentes/Estados';
import {
  AccionesFormulario,
  CampoSelect,
  CampoTexto,
  Formulario,
  combinarErrores,
  errorDe,
} from '../componentes/Formulario';
import { EstadoInsignia, Insignia } from '../componentes/Insignia';
import { BannerObservaciones, HistorialRevision } from '../componentes/Revision';
import { SubirArchivo } from '../componentes/SubirArchivo';
import { useToast } from '../componentes/Toast';
import {
  useActualizarDocumento,
  useDepartamentosDocumento,
  useDocumento,
  useDocumentosReemplazables,
  useRegistrarDocumento,
  useReenviarDocumento,
} from '../controladores/GestionarDocumentosAdmisionController';
import {
  DOCUMENTO_VACIO,
  ETIQUETA_TIPO_DOC,
  MAX_PDF_MB,
  TIPOS_DOCUMENTO,
  avisoVigencia,
  formDeDocumento,
  formatoFecha,
  puedeEditarDocumento,
  validarDocumento,
  type DocumentoDetalle,
  type FormDocumento,
  type VersionDocumento,
} from '../modelos/documentosAdmision';

/** `/panel/documentos/:id` (o `nuevo`): metadatos, PDF, «reemplaza a» y cadena de versiones. */
export default function PaginaEditarDocumento() {
  const { id } = useParams();
  if (id === 'nuevo' || id === 'nueva') return <Editor documento={null} />;
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? <Cargador id={n} /> : <ErrorEstado titulo="Documento no válido" error={new Error('El identificador del documento no es válido.')} />;
}

function Cargador({ id }: { id: number }) {
  const q = useDocumento(id);
  if (q.isPending) return <Cargando etiqueta="Cargando documento…" />;
  if (q.isError) return <ErrorEstado error={q.error} onReintentar={() => void q.refetch()} />;
  return <Editor documento={q.data} />;
}

function Editor({ documento }: { documento: DocumentoDetalle | null }) {
  const navegar = useNavigate();
  const toast = useToast();
  const esNuevo = !documento;
  const editable = esNuevo || puedeEditarDocumento(documento.estado);
  const registrar = useRegistrarDocumento();
  const actualizar = useActualizarDocumento(documento?.id_documento ?? 0);
  const reenviar = useReenviarDocumento(documento?.id_documento ?? 0);
  const departamentos = useDepartamentosDocumento();

  const [f, setF] = useState<FormDocumento>(documento ? formDeDocumento(documento) : DOCUMENTO_VACIO);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [local, setLocal] = useState<Record<string, string>>({});
  const reemplazables = useDocumentosReemplazables(f.tipo, esNuevo);

  const mutacion = esNuevo ? registrar : actualizar;
  const err = combinarErrores(local, erroresDeCampos(mutacion.error));
  const set = <K extends keyof FormDocumento>(k: K, v: FormDocumento[K]) => setF((s) => ({ ...s, [k]: v }));
  const aviso = avisoVigencia(f.fecha_vigencia);

  const datos = () => ({ ...f, archivo });

  const guardar = () => {
    const e = validarDocumento(f, esNuevo, archivo);
    setLocal(e);
    if (Object.keys(e).length) return;
    if (esNuevo) {
      registrar.mutate(datos(), {
        onSuccess: () => {
          toast.exito('Documento registrado y enviado a revisión.');
          navegar('/panel/documentos-admision?pestana=documentos');
        },
      });
    } else {
      actualizar.mutate(datos(), {
        onSuccess: () => {
          toast.exito('Cambios guardados.');
          setArchivo(null);
        },
      });
    }
  };

  const titulo = documento ? `${ETIQUETA_TIPO_DOC[documento.tipo] ?? documento.tipo} ${documento.numero}` : 'Nuevo documento oficial';

  return (
    <>
      <EncabezadoPagina
        titulo={titulo}
        volver={{ a: '/panel/documentos-admision?pestana=documentos', etiqueta: 'Documentos y admisión' }}
        descripcion={documento && <EstadoInsignia estado={documento.estado} />}
        acciones={
          documento?.estado === 'no_publicado' && (
            <Boton
              icono={<Send aria-hidden="true" className="h-4 w-4" />}
              cargando={reenviar.isPending}
              onClick={() => reenviar.mutate(undefined, { onSuccess: () => toast.exito('Documento reenviado a revisión.'), onError: (e) => toast.error(e) })}
            >
              Reenviar a revisión
            </Boton>
          )
        }
      />
      {documento && <BannerObservaciones observaciones={documento.observaciones_revision} fecha={documento.fecha_decision} className="mb-5" />}
      {!editable && (
        <p role="note" className="mb-5 rounded-md bg-gray-100 px-3 py-2 text-sm text-gray-700">
          Solo los documentos no publicados (observados) se pueden editar. Para actualizar uno vigente, registre un documento nuevo que lo reemplace.
        </p>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Tarjeta titulo="Datos del documento">
            <Formulario onEnviar={guardar} error={mutacion.error} aria-label="Datos del documento">
              <div className="grid gap-4 sm:grid-cols-2">
                <CampoSelect etiqueta="Tipo" requerido disabled={!editable || !esNuevo} placeholder="Seleccione…" value={f.tipo} onChange={(e) => setF((s) => ({ ...s, tipo: e.target.value, id_version_anterior: '' }))} opciones={TIPOS_DOCUMENTO.map((t) => ({ valor: t.valor, etiqueta: t.etiqueta }))} error={errorDe(err, 'tipo')} />
                <CampoTexto etiqueta="Número" requerido maxLength={50} disabled={!editable} value={f.numero} onChange={(e) => set('numero', e.target.value)} error={errorDe(err, 'numero')} ayuda="Ejemplo: 123-2026-D/FCF" />
                <CampoTexto className="sm:col-span-2" etiqueta="Título" maxLength={200} disabled={!editable} value={f.titulo} onChange={(e) => set('titulo', e.target.value)} error={errorDe(err, 'titulo')} />
                <CampoTexto etiqueta="Fecha de emisión" type="date" requerido disabled={!editable} value={f.fecha_emision} onChange={(e) => set('fecha_emision', e.target.value)} error={errorDe(err, 'fecha_emision')} />
                <CampoTexto etiqueta="Fecha de vigencia" type="date" requerido disabled={!editable} min={f.fecha_emision || undefined} value={f.fecha_vigencia} onChange={(e) => set('fecha_vigencia', e.target.value)} error={errorDe(err, 'fecha_vigencia')} />
                <CampoSelect
                  className="sm:col-span-2"
                  etiqueta="Departamento emisor"
                  requerido
                  disabled={!editable || departamentos.isPending}
                  placeholder={departamentos.isPending ? 'Cargando…' : 'Seleccione…'}
                  value={f.id_departamento_emisor}
                  onChange={(e) => set('id_departamento_emisor', e.target.value)}
                  opciones={(departamentos.data ?? []).map((d) => ({ valor: d.id_departamento, etiqueta: d.nombre }))}
                  error={errorDe(err, 'id_departamento_emisor') ?? (departamentos.isError ? 'No se pudo cargar la lista de departamentos.' : undefined)}
                />
              </div>

              {aviso && (
                <p role="status" className={`rounded-md px-3 py-2 text-sm ${aviso.tono === 'peligro' ? 'bg-red-50 text-red-800' : 'bg-gold/10 text-yellow-950'}`}>
                  Aviso de vigencia: {aviso.texto} {aviso.tono === 'peligro' ? 'Un documento vencido no puede aprobarse.' : 'Se avisará a la dirección antes del vencimiento.'}
                </p>
              )}

              {esNuevo ? (
                <CampoSelect
                  etiqueta="Reemplaza a (opcional)"
                  disabled={!f.tipo || reemplazables.isPending}
                  placeholder={f.tipo ? 'No reemplaza a ninguno' : 'Seleccione primero el tipo'}
                  value={f.id_version_anterior}
                  onChange={(e) => set('id_version_anterior', e.target.value)}
                  opciones={(reemplazables.data ?? []).map((d) => ({ valor: d.id_documento, etiqueta: `${d.numero}${d.titulo ? ` · ${d.titulo}` : ''} (${d.estado === 'vigente' ? 'vigente' : 'vencido'}, hasta ${formatoFecha(d.fecha_vigencia)})` }))}
                  error={errorDe(err, 'id_version_anterior')}
                  ayuda="Solo documentos vigentes o vencidos del mismo tipo que aún no tengan reemplazo. Al aprobarse, el anterior pasa a histórico."
                />
              ) : documento.anteriores.length > 0 ? (
                <p className="text-sm text-gray-700">Reemplaza a: {documento.anteriores[documento.anteriores.length - 1].numero}</p>
              ) : null}

              <SubirArchivo
                etiqueta="PDF del documento"
                aceptar="application/pdf"
                maxMB={MAX_PDF_MB}
                archivo={archivo}
                onSeleccionar={setArchivo}
                urlActual={documento?.archivo_url}
                deshabilitado={!editable}
                requerido={esNuevo}
                error={errorDe(err, 'archivo')}
                ayuda={esNuevo ? 'PDF de hasta 10 MB.' : 'Suba un PDF solo si desea reemplazar el actual.'}
              />

              {editable && (
                <AccionesFormulario>
                  <Link to="/panel/documentos-admision?pestana=documentos" className="inline-flex h-11 items-center justify-center rounded-md border border-gray-300 bg-white px-4 text-sm font-semibold text-ink hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold">
                    Cancelar
                  </Link>
                  <Boton type="submit" cargando={mutacion.isPending}>{esNuevo ? 'Registrar y enviar a revisión' : 'Guardar cambios'}</Boton>
                </AccionesFormulario>
              )}
            </Formulario>
          </Tarjeta>
        </div>

        <div className="space-y-5">
          {documento && (
            <>
              <Tarjeta titulo="Cadena de versiones">
                <CadenaVersiones actual={documento} />
              </Tarjeta>
              <Tarjeta titulo="Historial de revisión">
                <HistorialRevision entidad="documento" id={documento.id_documento} />
              </Tarjeta>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function CadenaVersiones({ actual }: { actual: DocumentoDetalle }) {
  const items: (VersionDocumento & { actual?: boolean })[] = [
    ...actual.posteriores.slice().reverse(),
    { ...actual, actual: true },
    ...actual.anteriores.slice().reverse(),
  ];
  if (items.length === 1) return <p className="text-sm text-gray-600">Este documento no reemplaza ni ha sido reemplazado por otro.</p>;
  return (
    <ol className="space-y-3">
      {items.map((v) => (
        <li key={v.id_documento} className="rounded-md border border-gray-200 p-3 text-sm" aria-current={v.actual ? 'true' : undefined}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            {v.actual ? <span className="font-semibold">{v.numero}</span> : <Link to={`/panel/documentos/${v.id_documento}`} className="font-semibold text-primary hover:underline">{v.numero}</Link>}
            {v.actual ? <Insignia tono="primario" punto={false}>Este documento</Insignia> : <EstadoInsignia estado={v.estado} />}
          </div>
          <p className="mt-1 text-xs text-gray-600">Emisión {formatoFecha(v.fecha_emision)} · vigencia {formatoFecha(v.fecha_vigencia)}</p>
        </li>
      ))}
    </ol>
  );
}
