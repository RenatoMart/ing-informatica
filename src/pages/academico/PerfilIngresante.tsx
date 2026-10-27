import React from 'react';
import { SectionTitle } from '../../components/ui/SectionTitle';
import { perfilIngresante } from '@profile/content/academico';
import { site } from '@/profile';
import { Check } from 'lucide-react';

export default function PerfilIngresante() {
  return (
    <div className="bg-white py-16 md:py-20">
      <div className="container mx-auto px-4 md:px-8">
        <div className="w-full max-w-4xl mx-auto">
          <SectionTitle
            title="Perfil del Ingresante"
            center
            subtitle={`Competencias del ingresante del ${site.programa.nombre}.`}
          />
          <div className="mt-8 bg-white p-6 md:p-8 rounded-xl shadow-md border border-gray-100">
            <ul className="space-y-4">
              {perfilIngresante.map((comp, idx) => (
                <li key={idx} className="flex gap-3 items-start">
                  <div className="bg-gold/15 text-gold rounded-full p-1 flex-shrink-0 mt-0.5">
                    <Check className="w-4 h-4" strokeWidth={3} />
                  </div>
                  <div>
                    <span className="font-bold text-primary">{comp.area}: </span>
                    <span className="text-gray-600 font-body text-sm leading-relaxed">{comp.descripcion}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
