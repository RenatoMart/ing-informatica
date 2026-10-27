import React from 'react';
import { SectionTitle } from '../../components/ui/SectionTitle';
import CompetenciaItem from '../../components/academico/CompetenciaItem';
import { perfilEgresado } from '@profile/content/academico';
import { site } from '@/profile';

export default function PerfilEgresado() {
  return (
    <div className="bg-white py-16 md:py-20">
      <div className="container mx-auto px-4 md:px-8">
        <div className="w-full max-w-4xl mx-auto">
          <SectionTitle
            title="Perfil del Egresado"
            center
            subtitle={`Al término de la carrera, el egresado del ${site.programa.nombre} tendrá las siguientes competencias.`}
          />
          <div className="mt-8 grid gap-4">
            {perfilEgresado.map((comp, idx) => (
              <CompetenciaItem key={idx} competencia={comp} index={idx} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}