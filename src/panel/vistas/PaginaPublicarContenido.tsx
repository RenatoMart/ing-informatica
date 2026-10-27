import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import {
  Boton,
  CampoSelect,
  DialogoConfirmar,
  EncabezadoPagina,
  EstadoInsignia,
  FiltroBarra,
  Paginacion,
  Tabla,
  clasesBoton,
  type ColumnaTabla,
} from '../componentes';
import {
  useAccionPublicacion,
  useCategoriasPublicacion,
  usePublicaciones,
  type AccionPublicacion,
} from '../controladores/PublicarContenidoController';
import { etiquetaEstado } from '../modelos/comunes';
import {
  ESTADOS_PUBLICACION,
  accionesPermitidas,
  formatoFecha,
  type FilaPublicacion,
  type FiltrosPublicaciones,
} from '../modelos/publicaciones';
import { useSesion } from '../sesion/SesionContext';

const TEXTOS_CONFIRMACION: Record<Exclude<AccionPublicacion, 'enviar-revision'>, { titulo: string; boton: string; mensaje: string }> = {
  'solicitar-baja': {
    titulo: 'Solicitar baja de la publicación',
    boton: 'Solicitar baja',
    mensaje: 'La publicación seguirá visible hasta que el Director apruebe la baja. ¿Desea continuar?',
  },
  descartar: {
    titulo: 'Descartar el borrador',
    boton: 'Descartar',
    mensaje: 'El borrador quedará descartado y no podrá recuperarse. ¿Desea continuar?',
  },
};

export default function PaginaPublicarContenido() {
  const { tieneRol } = useSesion();
  const puedeGestionar = tieneRol('Editor', 'Revisor');
  const [filtros, setFiltros] = useState<FiltrosPublicaciones>({ estado: '', categoria: '', q: '', pagina: 1 });
  const lista = usePublicaciones(filtros);
  const categorias = useCategoriasPublicacion();
  const accion = useAccionPublicacion();
  const [pendiente, setPendiente] = useState<{ fila: FilaPublicacion; accion: 'solicitar-baja' | 'descartar' } | null>(null);

  const cambiar = (parcial: Partial<FiltrosPublicaciones>) => setFiltros((f) => ({ ...f, pagina: 1, ...parcial }));

  const columnas: ColumnaTabla<FilaPublicacion>[] = [
    {
      clave: 'titulo',
      encabezado: 'Título',
      celda: (f) => (
        <Link
          to={`/panel/publicaciones/${f.id_publicacion}`}
          className="font-semibold text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          {f.titulo}
        </Link>
      ),
    },
    { clave: 'categoria', encabezado: 'Categoría', celda: (f) => f.categoria ?? '—' },
    {
      clave: 'estado',
      encabezado: 'Estado',
      celda: (f) => <EstadoInsignia estado={f.estado} operacion={f.operacion_pendiente} />,
    },
    { clave: 'programada', encabezado: 'Programada', celda: (f) => formatoFecha(f.fecha_publicacion_programada) },
    { clave: 'creacion', encabezado: 'Creada', celda: (f) => formatoFecha(f.fecha_creacion) },
    { clave: 'editor', encabezado: 'Editor', celda: (f) => f.editor },
    {
      clave: 'acciones',
      encabezado: 'Acciones',
      alinear: 'derecha',
      celda: (f) => {
        const a = accionesPermitidas(f.estado, f.operacion_pendiente);
        const etiqueta = a.editar && puedeGestionar ? 'Editar' : 'Ver';
        return (
          <div className="flex flex-wrap justify-end gap-2">
            <Link
              to={`/panel/publicaciones/${f.id_publicacion}`}
              className={clasesBoton('secundario', 'sm')}
              aria-label={`${etiqueta} ${f.titulo}`}
            >
              {etiqueta}
            </Link>
            {puedeGestionar && a.enviarRevision && (
              <Boton
                tamano="sm"
                variante="primario"
                aria-label={`Enviar a revisión ${f.titulo}`}
                cargando={accion.isPending && accion.variables?.id === f.id_publicacion && accion.variables.accion === 'enviar-revision'}
                onClick={() => accion.mutate({ id: f.id_publicacion, accion: 'enviar-revision' })}
              >
                Enviar
              </Boton>
            )}
            {puedeGestionar && a.solicitarBaja && (
              <Boton
                tamano="sm"
                variante="fantasma"
                aria-label={`Solicitar baja de ${f.titulo}`}
                onClick={() => setPendiente({ fila: f, accion: 'solicitar-baja' })}
              >
                Dar de baja
              </Boton>
            )}
            {puedeGestionar && a.descartar && (
              <Boton
                tamano="sm"
                variante="fantasma"
                aria-label={`Descartar ${f.titulo}`}
                onClick={() => setPendiente({ fila: f, accion: 'descartar' })}
              >
                Descartar
              </Boton>
            )}
          </div>
        );
      },
    },
  ];

  const textos = pendiente ? TEXTOS_CONFIRMACION[pendiente.accion] : null;

  return (
    <div className="space-y-6">
      <EncabezadoPagina
        titulo="Publicaciones"
        descripcion="Noticias y comunicados del sitio. Las publicaciones nuevas o modificadas pasan por la revisión del Director antes de mostrarse."
        acciones={
          puedeGestionar ? (
            <Link to="/panel/publicaciones/nueva" className={clasesBoton('primario', 'md')}>
              <Plus aria-hidden="true" className="h-4 w-4" />
              Nueva publicación
            </Link>
          ) : undefined
        }
      />

      <FiltroBarra
        busqueda={filtros.q}
        onBusqueda={(q) => cambiar({ q })}
        placeholder="Buscar por título…"
      >
        <CampoSelect
          etiqueta="Estado"
          etiquetaOculta
          className="w-full sm:w-48"
          value={filtros.estado}
          onChange={(e) => cambiar({ estado: e.target.value })}
          placeholder="Todos los estados"
          opciones={ESTADOS_PUBLICACION.map((s) => ({ valor: s, etiqueta: etiquetaEstado(s) }))}
        />
        <CampoSelect
          etiqueta="Categoría"
          etiquetaOculta
          className="w-full sm:w-48"
          value={filtros.categoria}
          onChange={(e) => cambiar({ categoria: e.target.value })}
          placeholder="Todas las categorías"
          opciones={(categorias.data ?? []).map((c) => ({ valor: c, etiqueta: c }))}
        />
      </FiltroBarra>

      <Tabla
        titulo="Listado de publicaciones"
        columnas={columnas}
        filas={lista.data?.data}
        claveFila={(f) => f.id_publicacion}
        cargando={lista.isLoading}
        error={lista.error}
        onReintentar={() => void lista.refetch()}
        vacio={
          filtros.q || filtros.estado || filtros.categoria
            ? 'No hay publicaciones que coincidan con los filtros.'
            : 'Aún no hay publicaciones. Cree la primera con «Nueva publicación».'
        }
      />
      <Paginacion meta={lista.data?.meta} onCambiar={(pagina) => setFiltros((f) => ({ ...f, pagina }))} />

      <DialogoConfirmar
        abierto={pendiente !== null}
        titulo={textos?.titulo ?? ''}
        mensaje={
          pendiente && textos ? (
            <>
              <strong>{pendiente.fila.titulo}</strong>. {textos.mensaje}
            </>
          ) : undefined
        }
        textoConfirmar={textos?.boton}
        peligro
        cargando={accion.isPending}
        error={accion.error}
        onCancelar={() => {
          setPendiente(null);
          accion.reset();
        }}
        onConfirmar={() => {
          if (!pendiente) return;
          accion.mutate(
            { id: pendiente.fila.id_publicacion, accion: pendiente.accion },
            { onSuccess: () => setPendiente(null) },
          );
        }}
      />
    </div>
  );
}
