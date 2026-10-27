import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Copy, Plus, Star } from 'lucide-react';
import { erroresDeCampos } from '../../lib/api';
import { Boton } from '../componentes/Boton';
import { Cargando, ErrorEstado, Vacio } from '../componentes/Estados';
import { CampoTexto, CampoSelect, Formulario, AccionesFormulario, combinarErrores, errorDe } from '../componentes/Formulario';
import { EstadoInsignia, Insignia } from '../componentes/Insignia';
import { Modal } from '../componentes/Modal';
import { DialogoConfirmar } from '../componentes/DialogoConfirmar';
import { EncabezadoPagina, Tarjeta } from '../componentes/EncabezadoPagina';
import { useToast } from '../componentes/Toast';
import {
  useCrearPlan,
  useDuplicarPlan,
  useEstablecerPredeterminado,
  usePermisosPlan,
  usePlanes,
} from '../controladores/GestionarPlanEstudiosController';
import { validarDatosPlan, type PlanResumen } from '../modelos/planes';

const FILTROS = [
  { valor: 'todos', etiqueta: 'Todas las versiones' },
  { valor: 'activas', etiqueta: 'En trabajo y vigentes' },
  { valor: 'historico', etiqueta: 'Histórico' },
];

/** `/panel/plan`: versiones del plan de estudios con su estado. */
export default function PaginaGestionarPlanEstudios() {
  const navegar = useNavigate();
  const toast = useToast();
  const { puedeEditar, puedeEstablecerPredeterminado } = usePermisosPlan();
  const consulta = usePlanes();
  const crear = useCrearPlan();
  const duplicar = useDuplicarPlan();
  const predeterminar = useEstablecerPredeterminado();

  const [filtro, setFiltro] = useState('todos');
  const [nueva, setNueva] = useState<{ anio: string; version: string } | null>(null);
  const [errLocal, setErrLocal] = useState<Record<string, string>>({});
  const [aDuplicar, setADuplicar] = useState<PlanResumen | null>(null);
  const [versionDup, setVersionDup] = useState('');
  const [errDup, setErrDup] = useState<string | null>(null);
  const [aPredeterminar, setAPredeterminar] = useState<PlanResumen | null>(null);

  const planes = useMemo(() => {
    const l = [...(consulta.data ?? [])].sort((a, b) => b.anio - a.anio || b.version.localeCompare(a.version));
    if (filtro === 'historico') return l.filter((p) => p.estado === 'historico');
    if (filtro === 'activas') return l.filter((p) => p.estado !== 'historico' && p.estado !== 'descartado');
    return l;
  }, [consulta.data, filtro]);

  const enviarNueva = () => {
    if (!nueva) return;
    const e = validarDatosPlan(nueva);
    setErrLocal(e);
    if (Object.keys(e).length) return;
    crear.mutate(
      { anio: Number(nueva.anio), version: nueva.version.trim() },
      {
        onSuccess: (id) => {
          toast.exito('Versión creada como borrador.');
          setNueva(null);
          navegar(`/panel/plan/${id}`);
        },
      },
    );
  };

  const enviarDuplicado = () => {
    if (!aDuplicar) return;
    if (!versionDup.trim()) {
      setErrDup('La nueva versión es obligatoria.');
      return;
    }
    setErrDup(null);
    duplicar.mutate(
      { id: aDuplicar.id_plan, version: versionDup.trim() },
      {
        onSuccess: (id) => {
          toast.exito('Versión duplicada como borrador.');
          setADuplicar(null);
          navegar(`/panel/plan/${id}`);
        },
      },
    );
  };

  return (
    <>
      <EncabezadoPagina
        titulo="Plan de estudios"
        descripcion="Versiones del plan por año. Solo una es la predeterminada del sitio público; las anteriores quedan como histórico consultable."
        acciones={
          puedeEditar && (
            <Boton
              icono={<Plus aria-hidden="true" className="h-4 w-4" />}
              onClick={() => {
                crear.reset();
                setErrLocal({});
                setNueva({ anio: String(new Date().getFullYear()), version: '' });
              }}
            >
              Nueva versión
            </Boton>
          )
        }
      />

      <div className="mb-4 max-w-xs">
        <CampoSelect
          etiqueta="Mostrar"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          opciones={FILTROS}
        />
      </div>

      {consulta.isPending ? (
        <Cargando etiqueta="Cargando versiones del plan…" />
      ) : consulta.isError ? (
        <ErrorEstado error={consulta.error} onReintentar={() => void consulta.refetch()} />
      ) : planes.length === 0 ? (
        <Tarjeta>
          <Vacio
            icono={<BookOpen className="h-9 w-9" />}
            titulo="No hay versiones del plan"
            descripcion={filtro === 'todos' ? 'Cree la primera versión para registrar los cursos por ciclo.' : 'Ninguna versión coincide con el filtro.'}
          />
        </Tarjeta>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {planes.map((p) => (
            <li key={p.id_plan} className="flex flex-col rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-display text-lg font-bold text-ink">
                    Plan {p.anio} <span className="text-gray-500">· v{p.version}</span>
                  </h2>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <EstadoInsignia estado={p.estado} />
                    {p.es_predeterminada && (
                      <Insignia tono="primario" punto={false}>
                        <Star aria-hidden="true" className="mr-1 inline h-3 w-3" />
                        Predeterminada
                      </Insignia>
                    )}
                  </div>
                </div>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-gray-500">Cursos</dt>
                  <dd className="text-lg font-semibold tabular-nums text-ink">{p.total_cursos}</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-gray-500">Créditos</dt>
                  <dd className="text-lg font-semibold tabular-nums text-ink">{p.total_creditos}</dd>
                </div>
              </dl>
              <div className="mt-5 flex flex-wrap gap-2 border-t border-gray-100 pt-4">
                <Link
                  to={`/panel/plan/${p.id_plan}`}
                  className="inline-flex h-9 items-center rounded-md bg-primary px-3 text-sm font-semibold text-white hover:bg-[#0e2c63] focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
                >
                  {p.estado === 'borrador' && puedeEditar ? 'Editar' : 'Ver'}
                  <span className="sr-only"> plan {p.anio} versión {p.version}</span>
                </Link>
                {puedeEditar && (
                  <Boton
                    tamano="sm"
                    variante="secundario"
                    icono={<Copy aria-hidden="true" className="h-4 w-4" />}
                    onClick={() => {
                      duplicar.reset();
                      setErrDup(null);
                      setVersionDup('');
                      setADuplicar(p);
                    }}
                  >
                    Duplicar<span className="sr-only"> plan {p.anio} versión {p.version}</span>
                  </Boton>
                )}
                {puedeEstablecerPredeterminado && !p.es_predeterminada && (p.estado === 'vigente' || p.estado === 'historico') && (
                  <Boton
                    tamano="sm"
                    variante="fantasma"
                    icono={<Star aria-hidden="true" className="h-4 w-4" />}
                    onClick={() => {
                      predeterminar.reset();
                      setAPredeterminar(p);
                    }}
                  >
                    Establecer predeterminado<span className="sr-only"> plan {p.anio} versión {p.version}</span>
                  </Boton>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        abierto={!!nueva}
        onCerrar={() => !crear.isPending && setNueva(null)}
        titulo="Nueva versión del plan"
        descripcion="Se crea como borrador. Luego agregue cursos, prerrequisitos y los PDF."
      >
        {nueva && (
          <Formulario onEnviar={enviarNueva} error={crear.error}>
            {(() => {
              const err = combinarErrores(errLocal, erroresDeCampos(crear.error));
              return (
                <>
                  <CampoTexto
                    etiqueta="Año"
                    type="number"
                    inputMode="numeric"
                    min={2000}
                    max={2100}
                    requerido
                    value={nueva.anio}
                    onChange={(e) => setNueva({ ...nueva, anio: e.target.value })}
                    error={errorDe(err, 'anio')}
                  />
                  <CampoTexto
                    etiqueta="Versión"
                    requerido
                    maxLength={20}
                    value={nueva.version}
                    onChange={(e) => setNueva({ ...nueva, version: e.target.value })}
                    error={errorDe(err, 'version')}
                    ayuda="Por ejemplo: 1, 2 o 2025-A."
                  />
                </>
              );
            })()}
            <AccionesFormulario>
              <Boton variante="secundario" onClick={() => setNueva(null)} disabled={crear.isPending}>
                Cancelar
              </Boton>
              <Boton type="submit" cargando={crear.isPending}>
                Crear borrador
              </Boton>
            </AccionesFormulario>
          </Formulario>
        )}
      </Modal>

      <Modal
        abierto={!!aDuplicar}
        onCerrar={() => !duplicar.isPending && setADuplicar(null)}
        titulo="Duplicar versión"
        descripcion={aDuplicar && `Copia el plan ${aDuplicar.anio} v${aDuplicar.version} (cursos, prerrequisitos y PDF) como un nuevo borrador del mismo año.`}
      >
        <Formulario onEnviar={enviarDuplicado} error={duplicar.error}>
          <CampoTexto
            etiqueta="Nueva versión"
            requerido
            maxLength={20}
            value={versionDup}
            onChange={(e) => setVersionDup(e.target.value)}
            error={errDup ?? errorDe(erroresDeCampos(duplicar.error), 'version')}
          />
          <AccionesFormulario>
            <Boton variante="secundario" onClick={() => setADuplicar(null)} disabled={duplicar.isPending}>
              Cancelar
            </Boton>
            <Boton type="submit" cargando={duplicar.isPending}>
              Duplicar
            </Boton>
          </AccionesFormulario>
        </Formulario>
      </Modal>

      <DialogoConfirmar
        abierto={!!aPredeterminar}
        titulo="Establecer como predeterminada"
        mensaje={
          aPredeterminar &&
          `El plan ${aPredeterminar.anio} v${aPredeterminar.version} será el que se muestre por defecto en el sitio público.`
        }
        textoConfirmar="Establecer"
        cargando={predeterminar.isPending}
        error={predeterminar.error}
        onCancelar={() => setAPredeterminar(null)}
        onConfirmar={() =>
          aPredeterminar &&
          predeterminar.mutate(aPredeterminar.id_plan, {
            onSuccess: () => {
              toast.exito('Versión predeterminada actualizada.');
              setAPredeterminar(null);
            },
          })
        }
      />
    </>
  );
}
