import React from 'react';
import { SectionTitle } from '../../components/ui/SectionTitle';
import AutoridadCard from '../../components/personas/AutoridadCard';
import { directorDepartamento } from '@profile/content/autoridades';
import { site } from '@/profile';

export default function DireccionDepartamento() {
  return (
    <div className="bg-gray-50 py-16 md:py-20">
      <div className="container mx-auto px-4 md:px-8">
        <SectionTitle
          title="Director de **Departamento**"
          center
          subtitle={`Autoridad encargada de la gestión académica del Departamento Académico de ${site.programa.nombreCorto}.`}
        />

        <div className="max-w-3xl mx-auto mt-8">
          <AutoridadCard autoridad={directorDepartamento} principal={true} />
        </div>
      </div>
    </div>
  );
}
