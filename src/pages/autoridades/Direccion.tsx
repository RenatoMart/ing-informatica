import React from 'react';
import { SectionTitle } from '../../components/ui/SectionTitle';
import AutoridadCard from '../../components/personas/AutoridadCard';
import { director, coordinadores } from '@profile/content/autoridades';
import { site } from '@/profile';

export default function Direccion() {
  return (
    <div className="bg-white py-16 md:py-20">
      <div className="container mx-auto px-4 md:px-8">
        <SectionTitle title="Órganos de **Dirección**" center subtitle={`Autoridades encargadas de la gestión académica y administrativa del ${site.denominacion}.`} />
        
        <div className="max-w-3xl mx-auto mt-8 mb-12">
          <AutoridadCard autoridad={director} principal={true} />
        </div>

        <h3 className="text-2xl md:text-3xl font-display font-bold text-center text-primary mb-10">Coordinaciones</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {coordinadores.map((coord, idx) => (
            <AutoridadCard key={idx} autoridad={coord} />
          ))}
        </div>
      </div>
    </div>
  );
}