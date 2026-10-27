import { useMemo, useState } from 'react';
import { SectionTitle } from '../../components/ui/SectionTitle';
import MallaFlow from '../../components/academico/MallaFlow';
import CurriculumVersionSwitch from '../../components/academico/CurriculumVersionSwitch';
import EnConstruccion from '../../components/layout/EnConstruccion';
import { etiquetaPlan, usePlan, usePlanes, useRegistrarVisita } from '../../data/ConsultarInformacionController';

const TITULO = (
  <SectionTitle
    title="Plan de **Estudios**"
    center
    subtitle="Explora la malla como un mapa interactivo: cada curso muestra créditos, horas y prerrequisitos. Toca un curso para ver su detalle."
  />
);

/** Vista estática (sin API): comportamiento original 2018 / 2027. */
function PlanEstatico() {
  const [version, setVersion] = useState('2027');
  return (
    <>
      <div className="mt-8 flex justify-start">
        <CurriculumVersionSwitch value={version} onChange={setVersion} />
      </div>
      <div className="mt-10">
        {version === '2018' ? (
          <MallaFlow />
        ) : (
          <EnConstruccion titulo="Malla **2027**" descripcion="La malla curricular 2027 estará disponible próximamente." />
        )}
      </div>
    </>
  );
}

function PlanApi({ planes }: { planes: NonNullable<ReturnType<typeof usePlanes>['datos']> }) {
  const opciones = useMemo(() => planes.map((p) => ({ id: p.id_plan, etiqueta: etiquetaPlan(p, planes) })), [planes]);
  const predeterminado = planes.find((p) => p.es_predeterminada) ?? planes[0];
  const [idSel, setIdSel] = useState<number | null>(null);
  const idActual = idSel ?? predeterminado?.id_plan ?? null;
  const etiquetaActual = opciones.find((o) => o.id === idActual)?.etiqueta ?? '';
  const { data: plan, isLoading, isError } = usePlan(idActual);

  return (
    <>
      <div className="mt-8 flex justify-start">
        <CurriculumVersionSwitch
          value={etiquetaActual}
          versions={opciones.map((o) => o.etiqueta)}
          onChange={(v) => setIdSel(opciones.find((o) => o.etiqueta === v)?.id ?? null)}
        />
      </div>
      <div className="mt-10">
        {isLoading ? (
          <div className="h-[32rem] rounded-xl bg-gray-100 animate-pulse" aria-busy="true" aria-label="Cargando malla" />
        ) : isError || !plan || plan.cursos.length === 0 ? (
          <EnConstruccion titulo={`Malla **${etiquetaActual}**`} descripcion="La malla curricular de esta versión estará disponible próximamente." />
        ) : (
          <>
            <MallaFlow
              key={plan.plan.id_plan}
              cursos={plan.cursos}
              aristas={plan.aristas}
              columnas={plan.columnas}
              pdfUrl={plan.plan.pdf_plan_url}
            />
            {plan.plan.pdf_resolucion_url && (
              <p className="mt-4 text-sm">
                <a href={plan.plan.pdf_resolucion_url} target="_blank" rel="noopener noreferrer" className="font-bold text-primary hover:text-gold transition-colors">
                  Descargar PDF de la resolución
                </a>
              </p>
            )}
          </>
        )}
      </div>
    </>
  );
}

export default function PlanEstudios() {
  useRegistrarVisita('plan_estudios');
  const { datos: planes, cargando } = usePlanes();

  return (
    <div className="bg-white py-16 md:py-20">
      <div className="container mx-auto px-4 md:px-8">
        {TITULO}
        {cargando ? (
          <div className="mt-10 h-[32rem] rounded-xl bg-gray-100 animate-pulse" aria-busy="true" aria-label="Cargando plan de estudios" />
        ) : planes && planes.length > 0 ? (
          <PlanApi planes={planes} />
        ) : planes ? (
          <div className="mt-10">
            <EnConstruccion titulo="Plan de **Estudios**" descripcion="El plan de estudios estará disponible próximamente." />
          </div>
        ) : (
          <PlanEstatico />
        )}
      </div>
    </div>
  );
}
