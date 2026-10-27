import React, { useState } from 'react';
import AnchoredSection from '../../components/layout/AnchoredSection';
import EnConstruccion from '../../components/layout/EnConstruccion';
import { SectionTitle } from '../../components/ui/SectionTitle';
import { Card } from '../../components/ui/Card';
import { objetivosEducacionales, objetivosEducacionalesUnt, objetivosAcademicos } from '@profile/content/identidad';
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
            <div className="bg-white py-16 md:py-20">
              <div className="container mx-auto px-4 md:px-8 max-w-4xl">
                <SectionTitle title="Objetivos **Académicos**" subtitle="Competencias que el programa se propone lograr en el estudiante." center />
                <Card className="p-6 mt-10">
                  <p className="text-gray-700 font-body leading-relaxed">{objetivosAcademicos.generica}</p>
                </Card>
                <ol className="mt-6 space-y-4">
                  {objetivosAcademicos.especificas.map((texto, i) => (
                    <li key={i}>
                      <Card className="p-6 flex gap-4">
                        <span className="shrink-0 font-display font-black text-gold">{i + 1}</span>
                        <p className="text-gray-700 font-body leading-relaxed">{texto}</p>
                      </Card>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </AnchoredSection>
          <AnchoredSection id="educativos">
            <div className="bg-gray-50 py-16 md:py-20">
              <div className="container mx-auto px-4 md:px-8 max-w-4xl">
                <SectionTitle title="Objetivos **Educacionales**" subtitle="Lo que se espera de nuestros egresados a pocos años de egresar." center />
                <ul className="mt-10 space-y-4">
                  {objetivosEducacionales.map((o) => (
                    <li key={o.codigo}>
                      <Card className="p-6 flex gap-4">
                        <span className="shrink-0 font-display font-black text-gold">{o.codigo}</span>
                        <p className="text-gray-700 font-body leading-relaxed">{o.descripcion}</p>
                      </Card>
                    </li>
                  ))}
                </ul>
                <h3 className="mt-14 mb-4 text-xl font-display font-bold text-primary text-center">Objetivos educacionales de la Universidad Nacional de Trujillo</h3>
                <ul className="space-y-4">
                  {objetivosEducacionalesUnt.map((o) => (
                    <li key={o.codigo}>
                      <Card className="p-6 flex gap-4">
                        <span className="shrink-0 font-display font-black text-gold">{o.codigo}</span>
                        <p className="text-gray-700 font-body leading-relaxed">{o.descripcion}</p>
                      </Card>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </AnchoredSection>
        </>
      ) : (
        <EnConstruccion titulo="Objetivos **2027**" descripcion="Los objetivos del plan 2027 estarán disponibles próximamente." />
      )}
    </>
  );
}
