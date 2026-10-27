import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, Copy, Pencil, Plus, Send, Trash2, XCircle } from 'lucide-react';
import { erroresDeCampos } from '../../lib/api';
import { Boton } from '../componentes/Boton';
import { DialogoConfirmar } from '../componentes/DialogoConfirmar';
import { EncabezadoPagina, Tarjeta } from '../componentes/EncabezadoPagina';
import { Cargando, ErrorEstado } from '../componentes/Estados';
import { AccionesFormulario, CampoAreaTexto, CampoTexto, Formulario, combinarErrores, errorDe } from '../componentes/Formulario';
import { EstadoInsignia } from '../componentes/Insignia';
import { Modal } from '../componentes/Modal';
import { BannerObservaciones, HistorialRevision, ListaValidacion } from '../componentes/Revision';
import { Tabla, type ColumnaTabla } from '../componentes/Tabla';
import { useToast } from '../componentes/Toast';
import {
  useActualizarCampana,
  useCampana,
  useCrearCampana,
  useDuplicarCampana,
  useEliminarHito,
  useEliminarModalidad,
  useEnviarRevisionCampana,
  useGuardarHito,
  useGuardarModalidad,
  useValidacionCampana,
  useVerificarEnlaces,
} from '../controladores/GestionarDocumentosAdmisionController';
import {
  CAMPANA_VACIA,
  formDeCampana,
  formatoFecha,
  puedeEditarCampana,
  soloFecha,
  validarCampana,
  validarHito,
  validarModalidad,
  type CampanaDetalle,
  type EstadoEnlace,
  type FormCampana,
  type Hito,
  type Modalidad,
} from '../modelos/documentosAdmision';

/** `/panel/campanas/:id` (o `nueva`): cabecera, modalidades, cronograma, validación y envío. */
export default function PaginaEditarCampana() {
  const { id } = useParams();
  if (id === 'nueva' || id === 'nuevo') return <Nueva />;
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? <Cargador id={n} /> : <ErrorEstado titulo="Campaña no válida" error={new Error('El identificador de la campaña no es válido.')} />;
}

function Cargador({ id }: { id: number }) {
  const q = useCampana(id);
  if (q.isPending) return <Cargando etiqueta="Cargando campaña…" />;
  if (q.isError) return <ErrorEstado error={q.error} onReintentar={() => void q.refetch()} />;
  return <Editor campana={q.data} />;
}

function Nueva() {
  const navegar = useNavigate();
  const toast = useToast();
  const crear = useCrearCampana();
  return (
    <>
      <EncabezadoPagina titulo="Nueva campaña de admisión" volver={{ a: '/panel/documentos-admision?pestana=admision', etiqueta: 'Documentos y admisión' }} descripcion="Primero registre la cabecera; luego podrá agregar modalidades y cronograma." />
      <Tarjeta>
        <FormCabecera
          campana={null}
          editable
          guardando={crear.isPending}
          error={crear.error}
          onGuardar={(d) => crear.mutate(d, { onSuccess: (id) => { toast.exito('Campaña creada como borrador.'); navegar(`/panel/campanas/${id}`, { replace: true }); } })}
        />
      </Tarjeta>
    </>
  );
}

function Editor({ campana }: { campana: CampanaDetalle }) {
  const navegar = useNavigate();
  const toast = useToast();
  const editable = puedeEditarCampana(campana.estado);
  const actualizar = useActualizarCampana(campana.id_campana);
  const duplicar = useDuplicarCampana();
  const enviar = useEnviarRevisionCampana(campana.id_campana);
  const [confirmarEnvio, setConfirmarEnvio] = useState(false);

  return (
    <>
      <EncabezadoPagina
        titulo={`Campaña ${campana.anio} · ${campana.proceso ?? ''}`}
        volver={{ a: '/panel/documentos-admision?pestana=admision', etiqueta: 'Documentos y admisión' }}
        descripcion={<EstadoInsignia estado={campana.estado} />}
        acciones={
          <>
            {campana.estado !== 'borrador' && campana.estado !== 'en_revision' && (
              <Boton variante="secundario" icono={<Copy aria-hidden="true" className="h-4 w-4" />} cargando={duplicar.isPending}
                onClick={() => duplicar.mutate(campana.id_campana, { onSuccess: (id) => { toast.exito('Borrador creado.'); navegar(`/panel/campanas/${id}`); }, onError: (e) => toast.error(e) })}>
                Duplicar para corregir
              </Boton>
            )}
            {editable && (
              <Boton icono={<Send aria-hidden="true" className="h-4 w-4" />} onClick={() => { enviar.reset(); setConfirmarEnvio(true); }}>
                Enviar a revisión
              </Boton>
            )}
          </>
        }
      />
      {campana.estado === 'borrador' && <BannerObservaciones observaciones={campana.observaciones_revision} fecha={campana.fecha_decision} className="mb-5" />}
      {!editable && (
        <p role="note" className="mb-5 rounded-md bg-gray-100 px-3 py-2 text-sm text-gray-700">
          Solo las campañas en borrador se pueden modificar. Use «Duplicar para corregir» para editar una copia.
        </p>
      )}

      <div className="space-y-5">
        <Tarjeta titulo="Cabecera y enlaces">
          <FormCabecera
            key={`${campana.anio}|${campana.proceso}|${campana.fecha_inicio}|${campana.fecha_fin}|${campana.url_portal}|${campana.url_estadisticas}`}
            campana={campana}
            editable={editable}
            guardando={actualizar.isPending}
            error={actualizar.error}
            onGuardar={(d) => actualizar.mutate(d, { onSuccess: () => toast.exito('Cabecera guardada.') })}
          />
        </Tarjeta>
        <Modalidades campana={campana} editable={editable} />
        <Cronograma campana={campana} editable={editable} />
        <Validacion id={campana.id_campana} />
        <Tarjeta titulo="Historial de revisión"><HistorialRevision entidad="campana" id={campana.id_campana} /></Tarjeta>
      </div>

      <DialogoConfirmar
        abierto={confirmarEnvio}
        titulo="Enviar a revisión"
        mensaje="Se verificarán los enlaces y se validará la campaña. Mientras esté en revisión no podrá editarla."
        textoConfirmar="Enviar"
        cargando={enviar.isPending}
        error={enviar.error}
        onCancelar={() => setConfirmarEnvio(false)}
        onConfirmar={() => enviar.mutate(undefined, { onSuccess: () => { setConfirmarEnvio(false); toast.exito('Campaña enviada a revisión.'); } })}
      />
    </>
  );
}

function IndicadorEnlace({ r }: { r?: EstadoEnlace }) {
  if (!r) return null;
  return r.ok ? (
    <p className="flex items-center gap-1 text-xs font-medium text-green-700"><CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5" /> Enlace operativo{r.estado_http ? ` (HTTP ${r.estado_http})` : ''}</p>
  ) : (
    <p className="flex items-center gap-1 text-xs font-medium text-danger"><XCircle aria-hidden="true" className="h-3.5 w-3.5" /> Enlace no operativo{r.estado_http ? ` (HTTP ${r.estado_http})` : ''}</p>
  );
}

function FormCabecera({ campana, editable, guardando, error, onGuardar }: {
  campana: CampanaDetalle | null;
  editable: boolean;
  guardando: boolean;
  error: unknown;
  onGuardar: (d: { anio: number; proceso: string; fecha_inicio: string; fecha_fin: string; url_portal: string; url_estadisticas: string }) => void;
}) {
  const toast = useToast();
  const verificar = useVerificarEnlaces(campana?.id_campana ?? 0);
  const [f, setF] = useState<FormCampana>(campana ? formDeCampana(campana) : CAMPANA_VACIA);
  const [local, setLocal] = useState<Record<string, string>>({});
  const err = combinarErrores(local, erroresDeCampos(error));
  const set = (k: keyof FormCampana, v: string) => setF((s) => ({ ...s, [k]: v }));
  const original = campana ? formDeCampana(campana) : null;
  const sucio = !original || (Object.keys(f) as (keyof FormCampana)[]).some((k) => f[k] !== original[k]);

  return (
    <Formulario
      error={error}
      aria-label="Cabecera de la campaña"
      onEnviar={() => {
        const e = validarCampana(f);
        setLocal(e);
        if (Object.keys(e).length) return;
        onGuardar({ anio: Number(f.anio), proceso: f.proceso.trim(), fecha_inicio: f.fecha_inicio, fecha_fin: f.fecha_fin, url_portal: f.url_portal.trim(), url_estadisticas: f.url_estadisticas.trim() });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CampoTexto etiqueta="Año" type="number" inputMode="numeric" requerido disabled={!editable} value={f.anio} onChange={(e) => set('anio', e.target.value)} error={errorDe(err, 'anio')} />
        <CampoTexto etiqueta="Proceso" requerido maxLength={50} disabled={!editable} value={f.proceso} onChange={(e) => set('proceso', e.target.value)} error={errorDe(err, 'proceso')} ayuda="Ejemplo: 2026-I" />
        <CampoTexto etiqueta="Fecha de inicio" type="date" requerido disabled={!editable} value={f.fecha_inicio} onChange={(e) => set('fecha_inicio', e.target.value)} error={errorDe(err, 'fecha_inicio')} />
        <CampoTexto etiqueta="Fecha de fin" type="date" requerido disabled={!editable} min={f.fecha_inicio || undefined} value={f.fecha_fin} onChange={(e) => set('fecha_fin', e.target.value)} error={errorDe(err, 'fecha_fin')} />
        <div className="space-y-1.5 sm:col-span-2">
          <CampoTexto etiqueta="URL del portal de admisión" type="url" requerido disabled={!editable} value={f.url_portal} onChange={(e) => set('url_portal', e.target.value)} error={errorDe(err, 'url_portal')} />
          <IndicadorEnlace r={verificar.data?.url_portal} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <CampoTexto etiqueta="URL de estadísticas" type="url" requerido disabled={!editable} value={f.url_estadisticas} onChange={(e) => set('url_estadisticas', e.target.value)} error={errorDe(err, 'url_estadisticas')} />
          <IndicadorEnlace r={verificar.data?.url_estadisticas} />
        </div>
      </div>
      {verificar.error ? <p role="alert" className="text-sm text-danger">{verificar.error.message}</p> : null}
      {editable && (
        <AccionesFormulario>
          {campana && (
            <Boton variante="secundario" cargando={verificar.isPending} disabled={sucio} title={sucio ? 'Guarde los cambios para verificar los enlaces guardados' : undefined}
              onClick={() => verificar.mutate(undefined, { onError: (e) => toast.error(e) })}>
              Verificar enlaces
            </Boton>
          )}
          <Boton type="submit" cargando={guardando}>{campana ? 'Guardar cabecera' : 'Crear borrador'}</Boton>
        </AccionesFormulario>
      )}
    </Formulario>
  );
}

function Modalidades({ campana, editable }: { campana: CampanaDetalle; editable: boolean }) {
  const toast = useToast();
  const guardar = useGuardarModalidad(campana.id_campana);
  const eliminar = useEliminarModalidad(campana.id_campana);
  const [ed, setEd] = useState<{ id?: number; nombre: string; dirigido_a: string; vacantes: string; descripcion: string } | null>(null);
  const [local, setLocal] = useState<Record<string, string>>({});
  const [aEliminar, setAEliminar] = useState<Modalidad | null>(null);
  const err = combinarErrores(local, erroresDeCampos(guardar.error));
  const total = campana.modalidades.reduce((s, m) => s + (m.vacantes ?? 0), 0);

  const columnas: ColumnaTabla<Modalidad>[] = [
    { clave: 'nombre', encabezado: 'Modalidad', celda: (m) => <span className="font-semibold">{m.nombre}</span> },
    { clave: 'dirigido', encabezado: 'Dirigida a', className: 'hidden md:table-cell', celda: (m) => m.dirigido_a || '—' },
    { clave: 'vacantes', encabezado: 'Vacantes', alinear: 'derecha', celda: (m) => <span className="tabular-nums">{m.vacantes ?? '—'}</span> },
    ...(editable ? [{
      clave: 'acc', encabezado: 'Acciones', encabezadoOculto: true, alinear: 'derecha' as const,
      celda: (m: Modalidad) => (
        <span className="whitespace-nowrap">
          <Boton tamano="sm" variante="fantasma" icono={<Pencil aria-hidden="true" className="h-4 w-4" />} onClick={() => { guardar.reset(); setLocal({}); setEd({ id: m.id_modalidad, nombre: m.nombre, dirigido_a: m.dirigido_a ?? '', vacantes: String(m.vacantes ?? ''), descripcion: m.descripcion ?? '' }); }}><span className="sr-only">Editar {m.nombre}</span></Boton>
          <Boton tamano="sm" variante="fantasma" className="text-danger hover:bg-red-50" icono={<Trash2 aria-hidden="true" className="h-4 w-4" />} onClick={() => { eliminar.reset(); setAEliminar(m); }}><span className="sr-only">Eliminar {m.nombre}</span></Boton>
        </span>
      ),
    }] : []),
  ];

  return (
    <Tarjeta
      titulo={`Modalidades (${total} vacantes)`}
      acciones={editable && <Boton tamano="sm" icono={<Plus aria-hidden="true" className="h-4 w-4" />} onClick={() => { guardar.reset(); setLocal({}); setEd({ nombre: '', dirigido_a: '', vacantes: '', descripcion: '' }); }}>Agregar modalidad</Boton>}
    >
      <Tabla titulo="Modalidades de admisión" columnas={columnas} filas={campana.modalidades} claveFila={(m) => m.id_modalidad} vacio={<p className="px-6 py-8 text-center text-sm text-gray-600">Aún no hay modalidades. Se requiere al menos una con vacantes mayores que 0.</p>} />
      <Modal abierto={!!ed} onCerrar={() => !guardar.isPending && setEd(null)} titulo={ed?.id ? 'Editar modalidad' : 'Agregar modalidad'}>
        {ed && (
          <Formulario
            error={guardar.error}
            onEnviar={() => {
              const e = validarModalidad(ed);
              setLocal(e);
              if (Object.keys(e).length) return;
              guardar.mutate({ id: ed.id, datos: { nombre: ed.nombre.trim(), dirigido_a: ed.dirigido_a.trim(), vacantes: Number(ed.vacantes), descripcion: ed.descripcion.trim() } }, { onSuccess: () => { toast.exito('Modalidad guardada.'); setEd(null); } });
            }}
          >
            <CampoTexto etiqueta="Nombre" requerido maxLength={100} value={ed.nombre} onChange={(e) => setEd({ ...ed, nombre: e.target.value })} error={errorDe(err, 'nombre')} />
            <CampoTexto etiqueta="Dirigida a" maxLength={150} value={ed.dirigido_a} onChange={(e) => setEd({ ...ed, dirigido_a: e.target.value })} error={errorDe(err, 'dirigido_a')} />
            <CampoTexto etiqueta="Vacantes" type="number" inputMode="numeric" min={1} requerido value={ed.vacantes} onChange={(e) => setEd({ ...ed, vacantes: e.target.value })} error={errorDe(err, 'vacantes')} />
            <CampoAreaTexto etiqueta="Descripción" rows={3} value={ed.descripcion} onChange={(e) => setEd({ ...ed, descripcion: e.target.value })} error={errorDe(err, 'descripcion')} />
            <AccionesFormulario>
              <Boton variante="secundario" onClick={() => setEd(null)} disabled={guardar.isPending}>Cancelar</Boton>
              <Boton type="submit" cargando={guardar.isPending}>Guardar</Boton>
            </AccionesFormulario>
          </Formulario>
        )}
      </Modal>
      <DialogoConfirmar
        abierto={!!aEliminar}
        peligro
        titulo="Eliminar modalidad"
        mensaje={aEliminar && `Se eliminará la modalidad «${aEliminar.nombre}».`}
        textoConfirmar="Eliminar"
        cargando={eliminar.isPending}
        error={eliminar.error}
        onCancelar={() => setAEliminar(null)}
        onConfirmar={() => aEliminar && eliminar.mutate(aEliminar.id_modalidad, { onSuccess: () => { toast.exito('Modalidad eliminada.'); setAEliminar(null); } })}
      />
    </Tarjeta>
  );
}

function Cronograma({ campana, editable }: { campana: CampanaDetalle; editable: boolean }) {
  const toast = useToast();
  const guardar = useGuardarHito(campana.id_campana);
  const eliminar = useEliminarHito(campana.id_campana);
  const [ed, setEd] = useState<{ id?: number; hito: string; fecha: string } | null>(null);
  const [local, setLocal] = useState<Record<string, string>>({});
  const [aEliminar, setAEliminar] = useState<Hito | null>(null);
  const err = combinarErrores(local, erroresDeCampos(guardar.error));
  const ordenados = [...campana.cronograma].sort((a, b) => soloFecha(a.fecha).localeCompare(soloFecha(b.fecha)));
  const inicio = soloFecha(campana.fecha_inicio);
  const fin = soloFecha(campana.fecha_fin);

  const columnas: ColumnaTabla<Hito>[] = [
    { clave: 'fecha', encabezado: 'Fecha', className: 'w-32', celda: (h) => <span className="tabular-nums">{formatoFecha(h.fecha)}</span> },
    { clave: 'hito', encabezado: 'Hito', celda: (h) => h.hito },
    ...(editable ? [{
      clave: 'acc', encabezado: 'Acciones', encabezadoOculto: true, alinear: 'derecha' as const,
      celda: (h: Hito) => (
        <span className="whitespace-nowrap">
          <Boton tamano="sm" variante="fantasma" icono={<Pencil aria-hidden="true" className="h-4 w-4" />} onClick={() => { guardar.reset(); setLocal({}); setEd({ id: h.id_hito, hito: h.hito, fecha: soloFecha(h.fecha) }); }}><span className="sr-only">Editar {h.hito}</span></Boton>
          <Boton tamano="sm" variante="fantasma" className="text-danger hover:bg-red-50" icono={<Trash2 aria-hidden="true" className="h-4 w-4" />} onClick={() => { eliminar.reset(); setAEliminar(h); }}><span className="sr-only">Eliminar {h.hito}</span></Boton>
        </span>
      ),
    }] : []),
  ];

  return (
    <Tarjeta
      titulo="Cronograma"
      acciones={editable && <Boton tamano="sm" icono={<Plus aria-hidden="true" className="h-4 w-4" />} onClick={() => { guardar.reset(); setLocal({}); setEd({ hito: '', fecha: '' }); }}>Agregar hito</Boton>}
    >
      <Tabla titulo="Cronograma de admisión ordenado por fecha" columnas={columnas} filas={ordenados} claveFila={(h) => h.id_hito} vacio={<p className="px-6 py-8 text-center text-sm text-gray-600">Aún no hay hitos en el cronograma.</p>} />
      <Modal abierto={!!ed} onCerrar={() => !guardar.isPending && setEd(null)} titulo={ed?.id ? 'Editar hito' : 'Agregar hito'} descripcion={inicio && fin ? `La fecha debe estar entre ${formatoFecha(inicio)} y ${formatoFecha(fin)}.` : 'Defina primero las fechas de la campaña.'}>
        {ed && (
          <Formulario
            error={guardar.error}
            onEnviar={() => {
              const e = validarHito(ed, inicio, fin);
              setLocal(e);
              if (Object.keys(e).length) return;
              guardar.mutate({ id: ed.id, datos: { hito: ed.hito.trim(), fecha: ed.fecha } }, { onSuccess: () => { toast.exito('Hito guardado.'); setEd(null); } });
            }}
          >
            <CampoTexto etiqueta="Hito" requerido maxLength={150} value={ed.hito} onChange={(e) => setEd({ ...ed, hito: e.target.value })} error={errorDe(err, 'hito')} />
            <CampoTexto etiqueta="Fecha" type="date" requerido min={inicio || undefined} max={fin || undefined} value={ed.fecha} onChange={(e) => setEd({ ...ed, fecha: e.target.value })} error={errorDe(err, 'fecha')} />
            <AccionesFormulario>
              <Boton variante="secundario" onClick={() => setEd(null)} disabled={guardar.isPending}>Cancelar</Boton>
              <Boton type="submit" cargando={guardar.isPending}>Guardar</Boton>
            </AccionesFormulario>
          </Formulario>
        )}
      </Modal>
      <DialogoConfirmar
        abierto={!!aEliminar}
        peligro
        titulo="Eliminar hito"
        mensaje={aEliminar && `Se eliminará «${aEliminar.hito}» del cronograma.`}
        textoConfirmar="Eliminar"
        cargando={eliminar.isPending}
        error={eliminar.error}
        onCancelar={() => setAEliminar(null)}
        onConfirmar={() => aEliminar && eliminar.mutate(aEliminar.id_hito, { onSuccess: () => { toast.exito('Hito eliminado.'); setAEliminar(null); } })}
      />
    </Tarjeta>
  );
}

function Validacion({ id }: { id: number }) {
  const q = useValidacionCampana(id);
  return (
    <Tarjeta titulo="Validación" acciones={<Boton tamano="sm" variante="secundario" onClick={() => void q.refetch()} cargando={q.isFetching}>Volver a validar</Boton>}>
      {q.isPending ? <Cargando etiqueta="Validando la campaña…" /> : q.isError ? <ErrorEstado error={q.error} onReintentar={() => void q.refetch()} /> : <ListaValidacion items={q.data} />}
    </Tarjeta>
  );
}
