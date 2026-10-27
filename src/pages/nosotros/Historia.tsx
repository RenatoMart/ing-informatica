import React from 'react';
import { SectionTitle } from '../../components/ui/SectionTitle';
import HitoTimeline from '../../components/identidad/HitoTimeline';
import { historia } from '@profile/content/identidad';

export default function Historia() {
  return (
    <div className="bg-white py-16 md:py-20">
      <div className="container mx-auto px-4 md:px-8">
        <SectionTitle title="Nuestra **Historia**" center subtitle="Formando ingenieros ambientales comprometidos con la sostenibilidad." />
        
        <div className="max-w-3xl mx-auto mt-12 mb-16 text-center">
          <p className="text-gray-600 font-body text-lg leading-relaxed bg-white p-8 rounded-xl border border-gray-100 shadow-sm">
            {historia.resena}
          </p>
          <div className="mt-6 inline-block bg-primary/10 text-primary px-5 py-2 rounded-full font-bold text-sm">
            Fundada en {historia.fundacion}
          </div>
        </div>

        <div className="max-w-4xl mx-auto mt-16">
          <h3 className="text-2xl md:text-3xl font-display font-bold text-center text-primary mb-12">Línea de Tiempo <span className="text-gold">Histórica</span></h3>
          <HitoTimeline hitos={historia.hitos} />
        </div>
      </div>
    </div>
  );
}