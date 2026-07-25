import { useState } from 'react';
import { SectionTitle } from '../../components/ui/SectionTitle';
import MallaFlow from '../../components/academico/MallaFlow';
import CurriculumVersionSwitch from '../../components/academico/CurriculumVersionSwitch';
import EnConstruccion from '../../components/layout/EnConstruccion';

export default function PlanEstudios() {
  const [version, setVersion] = useState('2027');

  return (
    <div className="bg-white py-16 md:py-20">
      <div className="container mx-auto px-4 md:px-8">
        <SectionTitle
          title="Plan de **Estudios**"
          center
          subtitle="Explora la malla como un mapa interactivo: cada curso muestra créditos, horas y prerrequisitos. Toca un curso para ver su detalle."
        />

        {/* Selector de versión de la malla (2018 / 2027) */}
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
      </div>
    </div>
  );
}
