import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Info, Plus, RotateCcw, Save, Send, Trash2, X } from 'lucide-react';
import {
  AccionesFormulario,
  BannerObservaciones,
  Boton,
  CampoCasilla,
  CampoSelect,
  CampoTexto,
  Cargando,
  DialogoConfirmar,
  EncabezadoPagina,
  ErrorEstado,
  EstadoInsignia,
  Formulario,
  HistorialRevision,
  SubirArchivo,
  Tarjeta,
  combinarErrores,
  dimensionesImagen,
  errorDe,
  useToast,
} from '../componentes';
import EditorEncuadre from '../componentes/EditorEncuadre';
import ModalDepartamento from '../componentes/ModalDepartamento';
import {
  idDeRuta,
  useAccionDocente,
  useDepartamentos,
  useDocente,
  useGuardarDocente,
  useGuardarFoto,
  type AccionDocente,
} from '../controladores/GestionarDocentesController';
import {
  CATEGORIAS_RENACYT_SUGERIDAS,
  CONDICIONES,
  ETIQUETA_CONDICION,
  FORM_DOCENTE_VACIO,
  FORMATOS_FOTO,
  GRADOS_SUGERIDOS,
  LIMITES_DOCENTE,
  accionesPermitidas,
  datosDesdeForm,
  formDesdeDetalle,
  motivoSoloLectura,
  nombreCompleto,
  validarDocente,
  validarEspecialidad,
  type FormDocente,
} from '../modelos/docentes';
import { useSesion } from '../sesion/SesionContext';

const L = LIMITES_DOCENTE;

async function validarFoto(f: File): Promise<string | null> {
  try {
    const { ancho, alto } = await dimensionesImagen(f);
    if (ancho < L.fotoMin || alto < L.fotoMin)
      return `La foto debe medir al menos ${L.fotoMin}×${L.fotoMin} px (la suya mide ${ancho}×${alto}).`;
    return null;
  } catch {
    return 'No se pudo leer la imagen. Pruebe con otro archivo.';
  }
}

export default function PaginaEditarDocente() {
  const { id: param } = useParams();
  const id = idDeRuta(param?.startsWith('nuev') ? 'nueva' : param);
  const esNuevo = param === 'nuevo' || param === 'nueva';
  const navigate = useNavigate();
  const toast = useToast();
  const { tieneRol } = useSesion();
  const puedeGestionar = tieneRol('Editor', 'Revisor');

  const detalle = useDocente(id);
  const deps = useDepartamentos();
  const guardar = useGuardarDocente();
  const guardarFoto = useGuardarFoto(id);
  const accion = useAccionDocente();

  const [form, setForm] = useState<FormDocente>(FORM_DOCENTE_VACIO);
  const [foto, setFoto] = useState<File | null>(null);
  const [fotoLocal, setFotoLocal] = useState<string | null>(null);
  const [nuevaEsp, setNuevaEsp] = useState('');
  const [errEsp, setErrEsp] = useState<string | null>(null);
  const [errCliente, setErrCliente] = useState<Record<string, string>>({});
  const [confirmar, setConfirmar] = useState<'solicitar-baja' | 'reactivar' | null>(null);
  const [modalDep, setModalDep] = useState(false);
  const sucio = useRef(false);

  const d = detalle.data;

  useEffect(() => {
    if (d && !sucio.current) setForm(formDesdeDetalle(d));
  }, [d]);
  useEffect(() => {
    sucio.current = false;
    setFoto(null);
    setErrCliente({});
    if (esNuevo) setForm(FORM_DOCENTE_VACIO);
  }, [param, esNuevo]);
  useEffect(() => {
    if (!foto) {
      setFotoLocal(null);
      return;
    }
    const url = URL.createObjectURL(foto);
    setFotoLocal(url);
    return () => URL.revokeObjectURL(url);
  }, [foto]);

  const permisos = useMemo(
    () => (esNuevo ? accionesPermitidas(undefined, null) : accionesPermitidas(d?.estado, d?.operacion_pendiente)),
    [esNuevo, d?.estado, d?.operacion_pendiente],
  );
  const editable = puedeGestionar && permisos.editar;
  const ocupado = guardar.isPending || guardarFoto.isPending || accion.isPending;

  const cambiar = <K extends keyof FormDocente>(campo: K, valor: FormDocente[K], clave?: string) => {
    sucio.current = true;
    setForm((f) => ({ ...f, [campo]: valor }));
    const k = clave ?? campo;
    setErrCliente((e) => {
      if (!e[k]) return e;
      const { [k]: _q, ...resto } = e;
      return resto;
    });
  };

  const errServidor = (guardar.error ?? accion.error ?? guardarFoto.error) as { campos?: Record<string, string[]> } | null;
  const errores = combinarErrores(errServidor?.campos, errCliente);

  const agregarEsp = () => {
    const e = validarEspecialidad(nuevaEsp, form.especialidades);
    setErrEsp(e);
    if (e) return;
    cambiar('especialidades', [...form.especialidades, nuevaEsp.trim()]);
    setNuevaEsp('');
  };

  const fotoActual = fotoLocal ?? d?.foto_url ?? null;
  const encuadreCambiado =
    d != null && (form.encuadreX !== formDesdeDetalle(d).encuadreX || form.encuadreY !== formDesdeDetalle(d).encuadreY);

  const alGuardar = () => {
    const e = validarDocente(form);
    setErrCliente(e);
    if (Object.keys(e).length) return;
    const conFoto = esNuevo && (foto !== null || form.encuadreX !== L.encuadreDefecto.x || form.encuadreY !== L.encuadreDefecto.y);
    guardar.mutate(
      {
        id,
        datos: datosDesdeForm(form),
        foto: conFoto ? { archivo: foto, encuadreX: form.encuadreX, encuadreY: form.encuadreY } : null,
      },
      {
        onSuccess: (r) => {
          sucio.current = false;
          if (r.creado) {
            if (r.errorFoto) toast.error(r.errorFoto);
            navigate(`/panel/docentes/${r.id}`, { replace: true });
          }
        },
      },
    );
  };

  const alEnviar = () => {
    if (id === undefined) return;
    const e = validarDocente(form);
    setErrCliente(e);
    if (Object.keys(e).length) {
      toast.error('Complete los campos marcados antes de enviar a revisión.');
      return;
    }
    guardar.mutate(
      { id, datos: datosDesdeForm(form) },
      {
        onSuccess: () => {
          sucio.current = false;
          accion.mutate({ id, accion: 'enviar-revision' });
        },
      },
    );
  };

  const alGuardarFoto = () => {
    guardarFoto.mutate(
      { archivo: foto, encuadreX: form.encuadreX, encuadreY: form.encuadreY },
      { onSuccess: () => setFoto(null) },
    );
  };

  const alConfirmar = () => {
    if (!confirmar || id === undefined) return;
    accion.mutate({ id, accion: confirmar as AccionDocente }, { onSuccess: () => { sucio.current = false; setConfirmar(null); } });
  };

  const volver = { a: '/panel/docentes', etiqueta: 'Docentes' };
  if (!esNuevo && id === undefined)
    return (
      <div className="space-y-6">
        <EncabezadoPagina titulo="Docente" volver={volver} />
        <ErrorEstado titulo="Docente no encontrado" error="El identificador del docente no es válido." />
      </div>
    );
  if (!esNuevo && detalle.isLoading) return <Cargando etiqueta="Cargando al docente…" />;
  if (!esNuevo && (detalle.isError || !d))
    return (
      <div className="space-y-6">
        <EncabezadoPagina titulo="Docente" volver={volver} />
        <ErrorEstado error={detalle.error} onReintentar={() => void detalle.refetch()} />
      </div>
    );

  const nombreTarjeta = nombreCompleto(form) || 'Nombre del docente';
  const tarjeta = {
    grado: form.grado || 'Grado',
    nombre: nombreTarjeta,
    cursoPrincipal: form.curso || 'Curso principal',
    especialidades: form.especialidades,
    investigador: form.esInvestigador,
    categoriaInvestigacion: form.esInvestigador ? form.renacyt || null : null,
    condicion: form.condicion ? ETIQUETA_CONDICION[form.condicion] : null,
  };
  const selectDeps = (deps.data ?? []).map((x) => ({ valor: x.id_departamento, etiqueta: x.nombre }));
  const confirmTexto =
    confirmar === 'reactivar'
      ? { t: 'Reactivar docente', b: 'Reactivar', m: 'El docente volverá a borrador para que pueda editarlo y enviarlo de nuevo a revisión.', p: false }
      : { t: 'Solicitar baja del docente', b: 'Solicitar baja', m: 'El docente seguirá visible hasta que el Director apruebe la baja; luego quedará inactivo.', p: true };

  return (
    <div className="space-y-6">
      <EncabezadoPagina
        titulo={esNuevo ? 'Nuevo docente' : nombreCompleto(d!)}
        volver={volver}
        descripcion={
          d ? <EstadoInsignia estado={d.estado} operacion={d.operacion_pendiente} /> : 'Complete los datos y guarde el borrador. Luego podrá agregar la foto y enviarlo a revisión.'
        }
      />

      {d?.estado === 'borrador' && d.observaciones_revision && (
        <BannerObservaciones observaciones={d.observaciones_revision} fecha={d.fecha_decision} />
      )}
      {d && !editable && (
        <p role="status" className="flex items-start gap-2 rounded-md border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900">
          <Info aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          {puedeGestionar ? motivoSoloLectura(d.estado, d.operacion_pendiente) : 'Su rol solo permite consultar este registro.'}
        </p>
      )}
      {editable && permisos.esCambio && (
        <p role="status" className="flex items-start gap-2 rounded-md border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900">
          <Info aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          Este docente ya está publicado. Sus cambios (datos, foto y encuadre) se guardan como propuesta y se aplican cuando el Director los apruebe.
        </p>
      )}

      <Tarjeta titulo="Datos del docente">
        <Formulario aria-label="Datos del docente" onEnviar={alGuardar} error={guardar.error ?? accion.error}>
          <div className="grid gap-4 sm:grid-cols-2">
            <CampoTexto etiqueta="Nombres" requerido value={form.nombres} maxLength={L.textoMax} readOnly={!editable} onChange={(e) => cambiar('nombres', e.target.value)} error={errorDe(errores, 'nombres')} />
            <CampoTexto etiqueta="Apellidos" requerido value={form.apellidos} maxLength={L.textoMax} readOnly={!editable} onChange={(e) => cambiar('apellidos', e.target.value)} error={errorDe(errores, 'apellidos')} />
            <CampoTexto etiqueta="Grado académico" requerido list="grados-docente" value={form.grado} readOnly={!editable} onChange={(e) => cambiar('grado', e.target.value, 'grado_academico')} error={errorDe(errores, 'grado_academico')} />
            <datalist id="grados-docente">
              {GRADOS_SUGERIDOS.map((g) => (
                <option key={g} value={g} />
              ))}
            </datalist>
            <div className="flex items-end gap-2">
              <CampoSelect
                etiqueta="Departamento"
                requerido
                className="flex-1"
                value={form.id_departamento}
                disabled={!editable}
                onChange={(e) => cambiar('id_departamento', e.target.value)}
                placeholder="Seleccione…"
                opciones={selectDeps}
                error={errorDe(errores, 'id_departamento')}
              />
              {editable && (
                <Boton variante="secundario" className="mb-px" aria-label="Crear un departamento nuevo" icono={<Plus aria-hidden="true" className="h-4 w-4" />} onClick={() => setModalDep(true)}>
                  Nuevo
                </Boton>
              )}
            </div>
            <CampoTexto etiqueta="Curso principal" requerido value={form.curso} readOnly={!editable} onChange={(e) => cambiar('curso', e.target.value, 'curso_principal')} error={errorDe(errores, 'curso_principal')} />
            <CampoSelect
              etiqueta="Condición laboral"
              requerido
              value={form.condicion}
              disabled={!editable}
              onChange={(e) => cambiar('condicion', e.target.value as FormDocente['condicion'], 'condicion_laboral')}
              placeholder="Seleccione…"
              opciones={CONDICIONES.map((c) => ({ valor: c.valor, etiqueta: c.etiqueta }))}
              error={errorDe(errores, 'condicion_laboral')}
            />
          </div>

          <CampoCasilla
            etiqueta="Es investigador"
            descripcion="Al marcarlo debe indicar su categoría RENACYT."
            checked={form.esInvestigador}
            disabled={!editable}
            onChange={(e) => cambiar('esInvestigador', e.target.checked, 'categoria_renacyt')}
          />
          {form.esInvestigador && (
            <>
              <CampoTexto etiqueta="Categoría RENACYT" requerido list="renacyt-docente" value={form.renacyt} readOnly={!editable} onChange={(e) => cambiar('renacyt', e.target.value, 'categoria_renacyt')} error={errorDe(errores, 'categoria_renacyt')} />
              <datalist id="renacyt-docente">
                {CATEGORIAS_RENACYT_SUGERIDAS.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </>
          )}

          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold text-ink">
              Especialidades <span aria-hidden="true" className="text-danger">*</span>
              <span className="ml-2 font-normal text-gray-600">
                ({form.especialidades.length}/{L.especialidadesMax})
              </span>
            </legend>
            {form.especialidades.length > 0 && (
              <ul className="flex flex-wrap gap-2" aria-label="Especialidades agregadas">
                {form.especialidades.map((esp, i) => (
                  <li key={esp} className="inline-flex items-center gap-1 rounded-full bg-primary/10 py-1 pl-3 pr-1 text-sm text-primary">
                    {esp}
                    {editable && (
                      <button
                        type="button"
                        aria-label={`Quitar la especialidad ${esp}`}
                        className="rounded-full p-1 hover:bg-primary/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                        onClick={() => cambiar('especialidades', form.especialidades.filter((_, j) => j !== i))}
                      >
                        <X aria-hidden="true" className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {editable && form.especialidades.length < L.especialidadesMax && (
              <div className="flex items-end gap-2">
                <CampoTexto
                  etiqueta="Nueva especialidad"
                  etiquetaOculta
                  placeholder="Escriba una especialidad y presione Enter"
                  className="flex-1"
                  value={nuevaEsp}
                  maxLength={L.textoMax}
                  onChange={(e) => {
                    setNuevaEsp(e.target.value);
                    setErrEsp(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      agregarEsp();
                    }
                  }}
                  error={errEsp}
                />
                <Boton variante="secundario" className="mb-px" icono={<Plus aria-hidden="true" className="h-4 w-4" />} onClick={agregarEsp}>
                  Agregar
                </Boton>
              </div>
            )}
            {errorDe(errores, 'especialidades') && (
              <p role="alert" className="text-sm font-medium text-danger">
                {errorDe(errores, 'especialidades')}
              </p>
            )}
          </fieldset>

          {puedeGestionar && (
            <AccionesFormulario>
              {editable && (
                <Boton type="submit" variante={permisos.enviarRevision ? 'secundario' : 'primario'} icono={<Save aria-hidden="true" className="h-4 w-4" />} cargando={guardar.isPending && !accion.isPending} disabled={ocupado}>
                  {esNuevo ? 'Crear borrador' : permisos.esCambio ? 'Guardar propuesta de cambio' : 'Guardar borrador'}
                </Boton>
              )}
              {permisos.enviarRevision && (
                <Boton icono={<Send aria-hidden="true" className="h-4 w-4" />} disabled={ocupado} cargando={accion.isPending && accion.variables?.accion === 'enviar-revision'} onClick={alEnviar}>
                  Enviar a revisión
                </Boton>
              )}
              {permisos.solicitarBaja && (
                <Boton variante="peligro" icono={<Trash2 aria-hidden="true" className="h-4 w-4" />} disabled={ocupado} onClick={() => setConfirmar('solicitar-baja')}>
                  Dar de baja
                </Boton>
              )}
              {permisos.reactivar && (
                <Boton icono={<RotateCcw aria-hidden="true" className="h-4 w-4" />} disabled={ocupado} onClick={() => setConfirmar('reactivar')}>
                  Reactivar
                </Boton>
              )}
            </AccionesFormulario>
          )}
        </Formulario>
      </Tarjeta>

      <Tarjeta titulo="Foto y encuadre">
        <div className="space-y-5">
          {editable && (
            <SubirArchivo
              etiqueta="Foto del docente"
              aceptar={FORMATOS_FOTO}
              maxMB={L.fotoMB}
              archivo={foto}
              onSeleccionar={setFoto}
              urlActual={d?.foto_url}
              validar={validarFoto}
              deshabilitado={ocupado}
              error={errorDe(errores, 'foto')}
              ayuda={`JPG, PNG o WebP, hasta ${L.fotoMB} MB y mínimo ${L.fotoMin}×${L.fotoMin} px.${esNuevo ? ' Se subirá al crear el borrador.' : ''}`}
            />
          )}
          <EditorEncuadre
            fotoUrl={fotoActual}
            encuadre={{ x: form.encuadreX, y: form.encuadreY }}
            onCambiar={(e) => {
              sucio.current = true;
              setForm((f) => ({ ...f, encuadreX: e.x, encuadreY: e.y }));
            }}
            tarjeta={tarjeta}
            deshabilitado={!editable}
          />
          {editable && !esNuevo && (
            <Boton cargando={guardarFoto.isPending} disabled={ocupado || (!foto && !encuadreCambiado)} onClick={alGuardarFoto}>
              {foto ? 'Guardar foto y encuadre' : 'Guardar encuadre'}
            </Boton>
          )}
        </div>
      </Tarjeta>

      {id !== undefined && (
        <Tarjeta titulo="Historial de revisión">
          <HistorialRevision entidad="docente" id={id} />
        </Tarjeta>
      )}

      <ModalDepartamento abierto={modalDep} departamento={null} onCerrar={() => setModalDep(false)} onGuardado={(nuevo) => cambiar('id_departamento', String(nuevo))} />

      <DialogoConfirmar
        abierto={confirmar !== null}
        titulo={confirmTexto.t}
        mensaje={confirmTexto.m}
        textoConfirmar={confirmTexto.b}
        peligro={confirmTexto.p}
        cargando={accion.isPending}
        error={accion.error}
        onCancelar={() => {
          setConfirmar(null);
          accion.reset();
        }}
        onConfirmar={alConfirmar}
      />
    </div>
  );
}
