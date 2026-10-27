import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import {
  Boton,
  CampoSelect,
  EncabezadoPagina,
  EstadoInsignia,
  FiltroBarra,
  PanelPestana,
  Paginacion,
  Pestanas,
  Tabla,
  clasesBoton,
  usePestanaUrl,
  type ColumnaTabla,
} from '../componentes';
import ModalDepartamento from '../componentes/ModalDepartamento';
import { useDepartamentos, useDocentes } from '../controladores/GestionarDocentesController';
import { etiquetaEstado } from '../modelos/comunes';
import {
  ESTADOS_DOCENTE,
  ETIQUETA_CONDICION,
  nombreCompleto,
  type Departamento,
  type FilaDocente,
  type FiltrosDocentes,
} from '../modelos/docentes';
import { useSesion } from '../sesion/SesionContext';

const PESTANAS = ['docentes', 'departamentos'] as const;

export default function PaginaGestionarDocentes() {
  const { tieneRol } = useSesion();
  const puede = tieneRol('Editor', 'Revisor');
  const [pestana, setPestana] = usePestanaUrl(PESTANAS, 'docentes');
  const [filtros, setFiltros] = useState<FiltrosDocentes>({ estado: '', id_departamento: '', q: '', pagina: 1 });
  const lista = useDocentes(filtros);
  const deps = useDepartamentos();
  const [modal, setModal] = useState<{ dep: Departamento | null } | null>(null);
  const cambiar = (p: Partial<FiltrosDocentes>) => setFiltros((f) => ({ ...f, pagina: 1, ...p }));

  const columnas: ColumnaTabla<FilaDocente>[] = [
    {
      clave: 'nombre',
      encabezado: 'Docente',
      celda: (f) => (
        <Link to={`/panel/docentes/${f.id_docente}`} className="font-semibold text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-gold">
          {nombreCompleto(f)}
        </Link>
      ),
    },
    { clave: 'grado', encabezado: 'Grado', celda: (f) => f.grado_academico ?? '—' },
    { clave: 'dep', encabezado: 'Departamento', celda: (f) => f.departamento ?? '—' },
    { clave: 'curso', encabezado: 'Curso principal', celda: (f) => f.curso_principal ?? '—' },
    { clave: 'cond', encabezado: 'Condición', celda: (f) => (f.condicion_laboral ? ETIQUETA_CONDICION[f.condicion_laboral] : '—') },
    {
      clave: 'inv',
      encabezado: 'Investigador',
      celda: (f) => (f.es_investigador ? (f.categoria_renacyt ? `Sí · ${f.categoria_renacyt}` : 'Sí') : 'No'),
    },
    { clave: 'estado', encabezado: 'Estado', celda: (f) => <EstadoInsignia estado={f.estado} operacion={f.operacion_pendiente} /> },
    {
      clave: 'acc',
      encabezado: 'Acciones',
      alinear: 'derecha',
      celda: (f) => (
        <Link to={`/panel/docentes/${f.id_docente}`} className={clasesBoton('secundario', 'sm')} aria-label={`Abrir ${nombreCompleto(f)}`}>
          {puede ? 'Editar' : 'Ver'}
        </Link>
      ),
    },
  ];

  const columnasDep: ColumnaTabla<Departamento>[] = [
    { clave: 'nombre', encabezado: 'Departamento', celda: (d) => <span className="font-semibold">{d.nombre}</span> },
    { clave: 'correo', encabezado: 'Correo', celda: (d) => d.correo ?? '—' },
    {
      clave: 'acc',
      encabezado: 'Acciones',
      alinear: 'derecha',
      celda: (d) =>
        puede ? (
          <Boton tamano="sm" variante="secundario" aria-label={`Editar ${d.nombre}`} onClick={() => setModal({ dep: d })}>
            Editar
          </Boton>
        ) : null,
    },
  ];

  const hayFiltros = !!(filtros.q || filtros.estado || filtros.id_departamento);

  return (
    <div className="space-y-6">
      <EncabezadoPagina
        titulo="Docentes"
        descripcion="Plana docente que se muestra en el sitio. Los altas, cambios y bajas pasan por la revisión del Director."
        acciones={
          puede ? (
            pestana === 'docentes' ? (
              <Link to="/panel/docentes/nuevo" className={clasesBoton('primario', 'md')}>
                <Plus aria-hidden="true" className="h-4 w-4" />
                Nuevo docente
              </Link>
            ) : (
              <Boton icono={<Plus aria-hidden="true" className="h-4 w-4" />} onClick={() => setModal({ dep: null })}>
                Nuevo departamento
              </Boton>
            )
          ) : undefined
        }
      />

      <Pestanas
        etiqueta="Secciones de docentes"
        activa={pestana}
        onCambiar={setPestana}
        pestanas={[
          { id: 'docentes', etiqueta: 'Docentes', contador: lista.data?.meta.total },
          { id: 'departamentos', etiqueta: 'Departamentos', contador: deps.data?.length },
        ]}
      />

      <PanelPestana id="docentes" activa={pestana} className="space-y-4">
        <FiltroBarra busqueda={filtros.q} onBusqueda={(q) => cambiar({ q })} placeholder="Buscar por nombre o curso…">
          <CampoSelect
            etiqueta="Estado"
            etiquetaOculta
            className="w-full sm:w-44"
            value={filtros.estado}
            onChange={(e) => cambiar({ estado: e.target.value })}
            placeholder="Todos los estados"
            opciones={ESTADOS_DOCENTE.map((s) => ({ valor: s, etiqueta: etiquetaEstado(s) }))}
          />
          <CampoSelect
            etiqueta="Departamento"
            etiquetaOculta
            className="w-full sm:w-56"
            value={filtros.id_departamento}
            onChange={(e) => cambiar({ id_departamento: e.target.value })}
            placeholder="Todos los departamentos"
            opciones={(deps.data ?? []).map((d) => ({ valor: d.id_departamento, etiqueta: d.nombre }))}
          />
        </FiltroBarra>
        <Tabla
          titulo="Listado de docentes"
          columnas={columnas}
          filas={lista.data?.data}
          claveFila={(f) => f.id_docente}
          cargando={lista.isLoading}
          error={lista.error}
          onReintentar={() => void lista.refetch()}
          vacio={hayFiltros ? 'No hay docentes que coincidan con los filtros.' : 'Aún no hay docentes registrados.'}
        />
        <Paginacion meta={lista.data?.meta} onCambiar={(pagina) => setFiltros((f) => ({ ...f, pagina }))} />
      </PanelPestana>

      <PanelPestana id="departamentos" activa={pestana}>
        <Tabla
          titulo="Listado de departamentos"
          columnas={columnasDep}
          filas={deps.data}
          claveFila={(d) => d.id_departamento}
          cargando={deps.isLoading}
          error={deps.error}
          onReintentar={() => void deps.refetch()}
          vacio="Aún no hay departamentos. Cree el primero con «Nuevo departamento»."
        />
      </PanelPestana>

      <ModalDepartamento abierto={modal !== null} departamento={modal?.dep ?? null} onCerrar={() => setModal(null)} />
    </div>
  );
}
