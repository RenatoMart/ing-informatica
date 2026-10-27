import React from 'react';
import { SectionTitle } from '../../components/ui/SectionTitle';
import InfoCard from '../../components/ui/InfoCard';
import { movilidad } from '@profile/content/academico';

export default function Movilidad() {
  return (
    <div className="bg-white py-16 md:py-20">
      <div className="container mx-auto px-4 md:px-8">
        <SectionTitle
          title="Movilidad **Académica**"
          center
          subtitle="Oportunidades de movilidad e intercambio para estudiantes y docentes del programa."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mt-12">
          {movilidad.map((item, idx) => (
            <InfoCard
              key={idx}
              titulo={item.institucion}
              tipo={item.tipo}
              descripcion={item.descripcion}
              metaLabel="Modalidad"
              metaValor={item.modalidad}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
