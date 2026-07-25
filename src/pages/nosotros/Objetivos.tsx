import React, { useState } from 'react';
import AnchoredSection from '../../components/layout/AnchoredSection';
import EnConstruccion from '../../components/layout/EnConstruccion';
import CurriculumVersionSwitch from '../../components/academico/CurriculumVersionSwitch';

/**
 * Página agrupada "Objetivos". El navbar muestra "Objetivos educativos" y
 * "Objetivos académicos" por separado; ambos llevan aquí (#educativos / #academicos).
 */
export default function Objetivos() {
  const [version, setVersion] = useState('2027');

  return (
    <>
      {/* Selector de versión del plan curricular (2018 / 2027) */}
      <div className="bg-white pt-10">
        <div className="container mx-auto px-4 md:px-8">
          <CurriculumVersionSwitch value={version} onChange={setVersion} />
        </div>
      </div>

      {version === '2018' ? (
        <>
          <AnchoredSection id="academicos">
            <EnConstruccion titulo="Objetivos **Académicos**" />
          </AnchoredSection>
          <AnchoredSection id="educativos">
            <EnConstruccion titulo="Objetivos **Educacionales**" bg="bg-gray-50" />
          </AnchoredSection>
        </>
      ) : (
        <EnConstruccion titulo="Objetivos **2027**" descripcion="Los objetivos del plan 2027 estarán disponibles próximamente." />
      )}
    </>
  );
}
