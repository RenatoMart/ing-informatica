import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Send } from 'lucide-react';
import { erroresDeCampos } from '../../lib/api';
import { Boton } from '../componentes/Boton';
import { DialogoConfirmar } from '../componentes/DialogoConfirmar';
import { EncabezadoPagina, Tarjeta } from '../componentes/EncabezadoPagina';
import { Cargando, ErrorEstado, Vacio } from '../componentes/Estados';
import { AccionesFormulario, CampoTexto, Formulario, combinarErrores, errorDe } from '../componentes/Formulario';
import { EstadoInsignia, Insignia } from '../componentes/Insignia';
import { PanelPestana, Pestanas, usePestanaUrl } from '../componentes/Pestanas';
import { BannerObservaciones, HistorialRevision, ListaValidacion } from '../componentes/Revision';
import { useToast } from '../componentes/Toast';
import {
  useActualizarPlan,
  useCrearPlan,
  useEnviarRevisionPlan,
  usePermisosPlan,
  usePlan,
  useValidacionPlan,
} from '../controladores/GestionarPlanEstudiosController';
import { datosMalla, puedeEditarPlan, validarDatosPlan, type PlanDetalle } from '../modelos/planes';
import { TabCursos } from './plan/TabCursos';
import { TabDocumentosPlan } from './plan/TabDocumentosPlan';
import { TabPrerrequisitos } from './plan/TabPrerrequisitos';

const MallaFlow = lazy(() => import('../../components/academico/MallaFlow'));

const PESTANAS = ['datos', 'cursos', 'prerrequisitos', 'documentos', 'validacion', 'malla', 'historial'] as const;

/** `/panel/plan/:id` (o `nueva`): datos, cursos, prerrequisitos, PDF, validación y malla. */
export default function PaginaEditarPlan() {
  const { id } = useParams();
  if (id === 'nueva' || id === 'nuevo') return <NuevoPlan />;
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? <EditorPlan id={n} /> : <ErrorEstado titulo="Versión no válida" error={new Error('El identificador de la versión no es válido.')} />;
}

function FormDatos({ inicial, editable, guardando, error, onGuardar, textoBoton }: {
  inicial: { anio: string; version: string };
  editable: boolean;
  guardando: boolean;
  error: unknown;
  onGuardar: (d: { anio: number; version: string }) => void;
  textoBoton: string;
}) {
  const [f, setF] = useState(inicial);
  const [local, setLocal] = useState<Record<string, string>>({});
  const err = combinarErrores(local, erroresDeCampos(error));
  return (
    <Formulario
      error={error}
      onEnviar={() => {
        const e = validarDatosPlan(f);
        setLocal(e);
        if (!Object.keys(e).length) onGuardar({ anio: Number(f.anio), version: f.version.trim() });
      }}
      className="max-w-xl"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <CampoTexto etiqueta="Año" type="number" inputMode="numeric" min={2000} max={2100} requerido disabled={!editable} value={f.anio} onChange={(e) => setF({ ...f, anio: e.target.value })} error={errorDe(err, 'anio')} />
        <CampoTexto etiqueta="Versión" requerido maxLength={20} disabled={!editable} value={f.version} onChange={(e) => setF({ ...f, version: e.target.value })} error={errorDe(err, 'version')} />
      </div>
      {editable && (
        <AccionesFormulario>
          <Boton type="submit" cargando={guardando}>{textoBoton}</Boton>
        </AccionesFormulario>
      )}
    </Formulario>
  );
}

function NuevoPlan() {
  const navegar = useNavigate();
  const toast = useToast();
  const crear = useCrearPlan();
  return (
    <>
      <EncabezadoPagina titulo="Nueva versión del plan" volver={{ a: '/panel/plan', etiqueta: 'Plan de estudios' }} />
      <Tarjeta>
        <FormDatos
          inicial={{ anio: String(new Date().getFullYear()), version: '' }}
          editable
          guardando={crear.isPending}
          error={crear.error}
          textoBoton="Crear borrador"
          onGuardar={(d) =>
            crear.mutate(d, {
              onSuccess: (nid) => {
                toast.exito('Versión creada como borrador.');
                navegar(`/panel/plan/${nid}`, { replace: true });
              },
            })
          }
        />
      </Tarjeta>
    </>
  );
}

function EditorPlan({ id }: { id: number }) {
  const toast = useToast();
  const { puedeEditar } = usePermisosPlan();
  const consulta = usePlan(id);
  const [pestana, setPestana] = usePestanaUrl(PESTANAS, 'datos');

  if (consulta.isPending) return <Cargando etiqueta="Cargando versión del plan…" />;
  if (consulta.isError) return <ErrorEstado error={consulta.error} onReintentar={() => void consulta.refetch()} />;
  const plan = consulta.data;
  const editable = puedeEditar && puedeEditarPlan(plan.estado);

  return (
    <>
      <EncabezadoPagina
        titulo={`Plan ${plan.anio} · v${plan.version}`}
        volver={{ a: '/panel/plan', etiqueta: 'Plan de estudios' }}
        descripcion={
          <span className="inline-flex flex-wrap items-center gap-1.5">
            <EstadoInsignia estado={plan.estado} />
            {plan.es_predeterminada && <Insignia tono="primario" punto={false}>Predeterminada</Insignia>}
          </span>
        }
        acciones={editable && <BotonEnviar plan={plan} onEnviado={() => toast.exito('Plan enviado a revisión.')} />}
      />
      {plan.estado === 'borrador' && <BannerObservaciones observaciones={plan.observaciones_revision} fecha={plan.fecha_decision} className="mb-5" />}

      <Pestanas
        etiqueta="Secciones de la versión del plan"
        activa={pestana}
        onCambiar={setPestana}
        idBase="plan"
        pestanas={[
          { id: 'datos', etiqueta: 'Datos' },
          { id: 'cursos', etiqueta: 'Cursos', contador: plan.cursos.length },
          { id: 'prerrequisitos', etiqueta: 'Prerrequisitos' },
          { id: 'documentos', etiqueta: 'Documentos' },
          { id: 'validacion', etiqueta: 'Validación' },
          { id: 'malla', etiqueta: 'Vista previa' },
          { id: 'historial', etiqueta: 'Historial' },
        ]}
      />
      <PanelPestana id="datos" activa={pestana} idBase="plan">
        <DatosPlan plan={plan} editable={editable} />
      </PanelPestana>
      <PanelPestana id="cursos" activa={pestana} idBase="plan">
        <TabCursos plan={plan} editable={editable} />
      </PanelPestana>
      <PanelPestana id="prerrequisitos" activa={pestana} idBase="plan">
        <TabPrerrequisitos plan={plan} editable={editable} />
      </PanelPestana>
      <PanelPestana id="documentos" activa={pestana} idBase="plan">
        <TabDocumentosPlan plan={plan} editable={editable} />
      </PanelPestana>
      <PanelPestana id="validacion" activa={pestana} idBase="plan">
        <TabValidacion id={id} />
      </PanelPestana>
      <PanelPestana id="malla" activa={pestana} idBase="plan">
        <VistaPreviaMalla plan={plan} />
      </PanelPestana>
      <PanelPestana id="historial" activa={pestana} idBase="plan">
        <Tarjeta titulo="Historial de revisión"><HistorialRevision entidad="plan" id={id} /></Tarjeta>
      </PanelPestana>
    </>
  );
}

function DatosPlan({ plan, editable }: { plan: PlanDetalle; editable: boolean }) {
  const toast = useToast();
  const actualizar = useActualizarPlan(plan.id_plan);
  return (
    <Tarjeta titulo="Datos de la versión">
      <FormDatos
        key={`${plan.anio}-${plan.version}`}
        inicial={{ anio: String(plan.anio), version: plan.version }}
        editable={editable}
        guardando={actualizar.isPending}
        error={actualizar.error}
        textoBoton="Guardar datos"
        onGuardar={(d) => actualizar.mutate(d, { onSuccess: () => toast.exito('Datos guardados.') })}
      />
      {!editable && <p className="mt-3 text-sm text-gray-600">Solo las versiones en borrador se pueden modificar.</p>}
    </Tarjeta>
  );
}

function TabValidacion({ id }: { id: number }) {
  const q = useValidacionPlan(id);
  if (q.isPending) return <Cargando etiqueta="Validando el plan…" />;
  if (q.isError) return <ErrorEstado error={q.error} onReintentar={() => void q.refetch()} />;
  return (
    <Tarjeta titulo="Errores y advertencias" acciones={<Boton tamano="sm" variante="secundario" onClick={() => void q.refetch()} cargando={q.isFetching}>Volver a validar</Boton>}>
      <ListaValidacion items={q.data} />
    </Tarjeta>
  );
}

function VistaPreviaMalla({ plan }: { plan: PlanDetalle }) {
  const malla = useMemo(() => datosMalla(plan.cursos, plan.prerrequisitos), [plan.cursos, plan.prerrequisitos]);
  if (!plan.cursos.length) return <Tarjeta><Vacio titulo="Sin cursos" descripcion="Agregue cursos para previsualizar la malla." /></Tarjeta>;
  return (
    <Suspense fallback={<Cargando etiqueta="Cargando malla…" />}>
      <MallaFlow cursos={malla.cursos} aristas={malla.aristas} columnas={malla.columnas} pdfUrl={plan.pdf_plan_url} />
    </Suspense>
  );
}

function BotonEnviar({ plan, onEnviado }: { plan: PlanDetalle; onEnviado: () => void }) {
  const enviar = useEnviarRevisionPlan(plan.id_plan);
  const [abierto, setAbierto] = useState(false);
  useEffect(() => {
    if (!abierto) enviar.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto]);
  return (
    <>
      <Boton icono={<Send aria-hidden="true" className="h-4 w-4" />} onClick={() => setAbierto(true)}>Enviar a revisión</Boton>
      <DialogoConfirmar
        abierto={abierto}
        titulo="Enviar a revisión"
        mensaje="El plan se validará y quedará bloqueado para edición hasta que el Revisor lo apruebe u observe."
        textoConfirmar="Enviar"
        cargando={enviar.isPending}
        error={enviar.error}
        onCancelar={() => setAbierto(false)}
        onConfirmar={() => enviar.mutate(undefined, { onSuccess: () => { setAbierto(false); onEnviado(); } })}
      />
    </>
  );
}
