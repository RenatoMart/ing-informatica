import React from 'react';
import { SectionTitle } from '../../components/ui/SectionTitle';
import ProyectoCard from '../../components/investigacion/ProyectoCard';
import { proyectos } from '@profile/content/investigacion';

export default function Proyectos() {
  return (
    <div className="bg-white py-16 md:py-20">
      <div className="container mx-auto px-4 md:px-8">
        <SectionTitle title="Proyectos de **Investigación**" center subtitle="Estudios e iniciativas en curso para mejorar la calidad ambiental y la sostenibilidad." />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto mt-12">
          {proyectos.map((proyecto, idx) => (
            <ProyectoCard key={idx} proyecto={proyecto} />
          ))}
        </div>
      </div>
    </div>
  );
}