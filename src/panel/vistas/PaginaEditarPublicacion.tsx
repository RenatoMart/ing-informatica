import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Info, Save, Send, Trash2 } from 'lucide-react';
import {
  AccionesFormulario,
  BannerObservaciones,
  Boton,
  Cargando,
  CampoAreaTexto,
  CampoTexto,
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
import {
  idDeRuta,
  useAccionPublicacion,
  useCategoriasPublicacion,
  useGuardarPublicacion,
  usePublicacion,
  useQuitarImagenPublicacion,
  useSubirImagenPublicacion,
  type AccionPublicacion,
} from '../controladores/PublicarContenidoController';
import {
  FORM_PUBLICACION_VACIO,
  FORMATOS_IMAGEN,
  LIMITES_PUBLICACION,
  accionesPermitidas,
  datosDesdeForm,
  formDesdeDetalle,
  hoyISO,
  motivoSoloLectura,
  validarPublicacion,
  type FormPublicacion,
} from '../modelos/publicaciones';
import { useSesion } from '../sesion/SesionContext';

const L = LIMITES_PUBLICACION;

async function validarImagen(f: File): Promise<string | null> {
  try {
    const { ancho, alto } = await dimensionesImagen(f);
    if (ancho < L.imagenAncho || alto < L.imagenAlto)
      return `La imagen debe medir al menos ${L.imagenAncho}×${L.imagenAlto} px (la suya mide ${ancho}×${alto}).`;
    return null;
  } catch {
    return 'No se pudo leer la imagen. Pruebe con otro archivo.';
  }
}

type Confirmacion = 'solicitar-baja' | 'descartar' | { quitar: number } | null;

export default function PaginaEditarPublicacion() {
  const { id: param } = useParams();
  const id = idDeRuta(param);
  const esNueva = param === 'nueva';
  const navigate = useNavigate();
  const toast = useToast();
  const { tieneRol } = useSesion();
  const puedeGestionar = tieneRol('Editor', 'Revisor');

  const detalle = usePublicacion(id);
  const categorias = useCategoriasPublicacion();
  const guardar = useGuardarPublicacion();
  const accion = useAccionPublicacion();
  const subir = useSubirImagenPublicacion(id);
  const quitar = useQuitarImagenPublicacion(id);

  const [form, setForm] = useState<FormPublicacion>(FORM_PUBLICACION_VACIO);
  const [imagen, setImagen] = useState<File | null>(null);
  const [erroresCliente, setErroresCliente] = useState<Record<string, string>>({});
  const [confirmar, setConfirmar] = useState<Confirmacion>(null);
  const sucio = useRef(false);

  const d = detalle.data;

  // Sincroniza el formulario con el servidor mientras no haya ediciones sin guardar.
  useEffect(() => {
    if (d && !sucio.current) setForm(formDesdeDetalle(d));
  }, [d]);
  useEffect(() => {
    sucio.current = false;
    setImagen(null);
    setErroresCliente({});
    if (esNueva) setForm(FORM_PUBLICACION_VACIO);
  }, [param, esNueva]);

  const permisos = useMemo(
    () => (esNueva ? accionesPermitidas(undefined, null) : accionesPermitidas(d?.estado, d?.operacion_pendiente)),
    [esNueva, d?.estado, d?.operacion_pendiente],
  );
  const editable = puedeGestionar && permisos.editar;
  const ocupado = guardar.isPending || accion.isPending || subir.isPending || quitar.isPending;

  const cambiar = <K extends keyof FormPublicacion>(campo: K, valor: FormPublicacion[K]) => {
    sucio.current = true;
    setForm((f) => ({ ...f, [campo]: valor }));
    setErroresCliente((e) => {
      if (!e[campo]) return e;
      const { [campo]: _quitado, ...resto } = e;
      return resto;
    });
  };

  // Errores del servidor (422) y del cliente combinados; el servidor llama `fecha_publicacion_programada` a `fecha`.
  const erroresServidor = useMemo(() => {
    const e = guardar.error ?? accion.error ?? subir.error;
    const campos = (e as { campos?: Record<string, string[]> } | null)?.campos ?? {};
    return { ...campos, fecha: campos.fecha_publicacion_programada ?? campos.fecha, imagen: campos.imagen ?? campos.imagenes };
  }, [guardar.error, accion.error, subir.error]);
  const errores = combinarErrores(erroresServidor, erroresCliente);

  const tieneImagen = (d?.archivos.length ?? 0) > 0 || (esNueva && imagen !== null);
  const fechaOriginal = d ? formDesdeDetalle(d).fecha : '';

  const alGuardar = (despues?: () => void) => {
    const e = validarPublicacion(form, { fechaOriginal });
    setErroresCliente(e);
    if (Object.keys(e).length) return;
    guardar.mutate(
      { id, datos: datosDesdeForm(form), imagen: esNueva ? imagen : null },
      {
        onSuccess: (r) => {
          sucio.current = false;
          if (r.creada) {
            if (r.errorImagen) toast.error(r.errorImagen);
            navigate(`/panel/publicaciones/${r.id}`, { replace: true });
          } else {
            despues?.();
          }
        },
      },
    );
  };

  const alEnviarRevision = () => {
    if (id === undefined) return;
    const e = validarPublicacion(form, { paraEnviar: true, tieneImagen, fechaOriginal });
    setErroresCliente(e);
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

  const alConfirmar = () => {
    if (!confirmar || id === undefined) return;
    if (typeof confirmar === 'object') {
      quitar.mutate(confirmar.quitar, { onSuccess: () => setConfirmar(null) });
      return;
    }
    accion.mutate({ id, accion: confirmar as AccionPublicacion }, { onSuccess: () => setConfirmar(null) });
  };

  const alSubirImagen = () => {
    if (!imagen || id === undefined) return;
    subir.mutate(imagen, { onSuccess: () => setImagen(null) });
  };

  const volver = { a: '/panel/publicaciones', etiqueta: 'Publicaciones' };

  if (!esNueva && id === undefined) {
    return (
      <div className="space-y-6">
        <EncabezadoPagina titulo="Publicación" volver={volver} />
        <ErrorEstado titulo="Publicación no encontrada" error="El identificador de la publicación no es válido." />
      </div>
    );
  }
  if (!esNueva && detalle.isLoading) return <Cargando etiqueta="Cargando la publicación…" />;
  if (!esNueva && (detalle.isError || !d)) {
    return (
      <div className="space-y-6">
        <EncabezadoPagina titulo="Publicación" volver={volver} />
        <ErrorEstado error={detalle.error} onReintentar={() => void detalle.refetch()} />
      </div>
    );
  }

  const titulo = esNueva ? 'Nueva publicación' : (d?.titulo ?? 'Publicación');
  const textoConfirmacion =
    confirmar === 'solicitar-baja'
      ? { titulo: 'Solicitar baja de la publicación', boton: 'Solicitar baja', msg: 'La publicación seguirá visible hasta que el Director apruebe la baja.' }
      : confirmar === 'descartar'
        ? { titulo: 'Descartar el borrador', boton: 'Descartar', msg: 'El borrador quedará descartado y no podrá recuperarse.' }
        : confirmar
          ? { titulo: 'Quitar la imagen', boton: 'Quitar imagen', msg: 'La imagen se quitará de la publicación.' }
          : null;
  const confirmando = typeof confirmar === 'object' && confirmar !== null ? quitar : accion;
  const maxImagenes = (d?.archivos.length ?? 0) >= L.maxImagenes;

  return (
    <div className="space-y-6">
      <EncabezadoPagina
        titulo={titulo}
        volver={volver}
        descripcion={
          d ? (
            <span className="inline-flex items-center gap-2">
              <EstadoInsignia estado={d.estado} operacion={d.operacion_pendiente} />
              <span className="text-sm text-gray-600">Editor: {d.editor}</span>
            </span>
          ) : (
            'Complete los datos y guarde el borrador. Luego podrá enviarlo a revisión.'
          )
        }
      />

      {d?.estado === 'borrador' && d.observaciones_revision && (
        <BannerObservaciones observaciones={d.observaciones_revision} fecha={d.fecha_decision} />
      )}
      {d && !editable && (
        <p role="status" className="flex items-start gap-2 rounded-md border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900">
          <Info aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          {puedeGestionar ? motivoSoloLectura(d.estado, d.operacion_pendiente) : 'Su rol solo permite consultar esta publicación.'}
        </p>
      )}
      {editable && permisos.esCambio && (
        <p role="status" className="flex items-start gap-2 rounded-md border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900">
          <Info aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          {d?.operacion_pendiente === 'cambio'
            ? 'Hay una propuesta de cambio pendiente de revisión; guardar la sobrescribe. Lo publicado no cambia hasta que el Director la apruebe.'
            : 'Esta publicación ya está visible. Sus cambios se guardan como propuesta y se aplican cuando el Director los apruebe.'}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Tarjeta titulo="Contenido">
            <Formulario
              aria-label="Datos de la publicación"
              onEnviar={() => alGuardar()}
              error={guardar.error ?? accion.error}
            >
              <CampoTexto
                etiqueta="Título"
                requerido
                value={form.titulo}
                maxLength={L.tituloMax}
                readOnly={!editable}
                onChange={(e) => cambiar('titulo', e.target.value)}
                error={errorDe(errores, 'titulo')}
                ayuda={`Entre ${L.tituloMin} y ${L.tituloMax} caracteres.`}
              />
              <CampoAreaTexto
                etiqueta="Resumen"
                rows={3}
                value={form.resumen}
                readOnly={!editable}
                onChange={(e) => cambiar('resumen', e.target.value)}
                error={errorDe(errores, 'resumen')}
                ayuda={`${form.resumen.length}/${L.resumenMax} caracteres. Obligatorio para enviar a revisión.`}
              />
              <CampoTexto
                etiqueta="Categoría"
                list="categorias-publicacion"
                value={form.categoria}
                maxLength={L.categoriaMax}
                readOnly={!editable}
                onChange={(e) => cambiar('categoria', e.target.value)}
                error={errorDe(errores, 'categoria')}
                ayuda="Elija una existente o escriba una nueva. Obligatoria para enviar a revisión."
              />
              <datalist id="categorias-publicacion">
                {(categorias.data ?? []).map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
              <CampoAreaTexto
                etiqueta="Contenido"
                rows={12}
                value={form.contenido}
                readOnly={!editable}
                onChange={(e) => cambiar('contenido', e.target.value)}
                error={errorDe(errores, 'contenido')}
              />
              <CampoTexto
                etiqueta="Fecha de publicación programada"
                type="date"
                min={hoyISO()}
                value={form.fecha}
                disabled={!editable}
                onChange={(e) => cambiar('fecha', e.target.value)}
                error={errorDe(errores, 'fecha')}
                ayuda="Opcional. Una vez aprobada, la publicación se mostrará desde esta fecha; si no la indica, desde su aprobación."
              />

              {puedeGestionar && (
                <AccionesFormulario>
                  {editable && (
                    <Boton type="submit" variante={permisos.enviarRevision ? 'secundario' : 'primario'} icono={<Save aria-hidden="true" className="h-4 w-4" />} cargando={guardar.isPending && !accion.isPending}>
                      {esNueva ? 'Crear borrador' : permisos.esCambio ? 'Guardar propuesta de cambio' : 'Guardar borrador'}
                    </Boton>
                  )}
                  {permisos.enviarRevision && (
                    <Boton variante="primario" icono={<Send aria-hidden="true" className="h-4 w-4" />} disabled={ocupado} cargando={accion.isPending && accion.variables?.accion === 'enviar-revision'} onClick={alEnviarRevision}>
                      Enviar a revisión
                    </Boton>
                  )}
                  {permisos.solicitarBaja && (
                    <Boton variante="peligro" icono={<Trash2 aria-hidden="true" className="h-4 w-4" />} disabled={ocupado} onClick={() => setConfirmar('solicitar-baja')}>
                      Dar de baja
                    </Boton>
                  )}
                  {permisos.descartar && (
                    <Boton variante="fantasma" disabled={ocupado} onClick={() => setConfirmar('descartar')}>
                      Descartar borrador
                    </Boton>
                  )}
                </AccionesFormulario>
              )}
            </Formulario>
          </Tarjeta>
        </div>

        <div className="space-y-6">
          <Tarjeta titulo="Imágenes">
            {d && d.archivos.length > 0 && (
              <ul className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {d.archivos.map((a, i) => (
                  <li key={a.id_archivo} className="space-y-1">
                    <img
                      src={a.url}
                      alt={`Imagen ${i + 1} de la publicación`}
                      width={a.ancho_px}
                      height={a.alto_px}
                      loading="lazy"
                      className="aspect-[3/2] w-full rounded-md border border-gray-200 object-cover"
                    />
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span>
                        {i === 0 ? 'Portada · ' : ''}
                        {a.ancho_px}×{a.alto_px}
                      </span>
                      {editable && (
                        <Boton tamano="sm" variante="fantasma" aria-label={`Quitar imagen ${i + 1}`} disabled={ocupado} onClick={() => setConfirmar({ quitar: a.id_archivo })}>
                          Quitar
                        </Boton>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {errores.imagen && (
              <p role="alert" className="mb-3 text-sm font-medium text-danger">
                {errores.imagen}
              </p>
            )}
            {editable && !maxImagenes ? (
              <div className="space-y-3">
                <SubirArchivo
                  etiqueta={esNueva ? 'Imagen de portada' : 'Agregar imagen'}
                  aceptar={FORMATOS_IMAGEN}
                  maxMB={L.imagenMB}
                  archivo={imagen}
                  onSeleccionar={setImagen}
                  validar={validarImagen}
                  deshabilitado={ocupado}
                  ayuda={`JPG, PNG o WebP, hasta ${L.imagenMB} MB y mínimo ${L.imagenAncho}×${L.imagenAlto} px. Se recorta a ${L.imagenAncho}×${L.imagenAlto} (proporción 3:2) y se optimiza al subir.${esNueva ? ' Se subirá al crear el borrador.' : ''}`}
                />
                {!esNueva && imagen && (
                  <Boton cargando={subir.isPending} onClick={alSubirImagen}>
                    Subir imagen
                  </Boton>
                )}
              </div>
            ) : (
              !d?.archivos.length && <p className="text-sm text-gray-600">Sin imágenes.</p>
            )}
            {editable && maxImagenes && (
              <p className="text-sm text-gray-600">Se alcanzó el máximo de {L.maxImagenes} imágenes.</p>
            )}
          </Tarjeta>

          {id !== undefined && (
            <Tarjeta titulo="Historial de revisión">
              <HistorialRevision entidad="publicacion" id={id} />
            </Tarjeta>
          )}
        </div>
      </div>

      <DialogoConfirmar
        abierto={confirmar !== null}
        titulo={textoConfirmacion?.titulo ?? ''}
        mensaje={textoConfirmacion?.msg}
        textoConfirmar={textoConfirmacion?.boton}
        peligro
        cargando={confirmando.isPending}
        error={confirmando.error}
        onCancelar={() => {
          setConfirmar(null);
          accion.reset();
          quitar.reset();
        }}
        onConfirmar={alConfirmar}
      />
    </div>
  );
}
