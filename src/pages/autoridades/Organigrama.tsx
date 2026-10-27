import React from 'react';
import { SectionTitle } from '../../components/ui/SectionTitle';
import { site } from '@/profile';
import mapaProcesos from '@profile/assets/organigrama/mapa-procesos.png';

export default function Organigrama() {
  return (
    <div className="bg-white py-16 md:py-20 overflow-hidden">
      <div className="container mx-auto px-4 md:px-8">
        <SectionTitle title="MAPA DE PROCESOS DEL **SISTEMA DE GESTIÓN DE CALIDAD**" center subtitle={`Organización de Procesos Estratégicos, Misionales y de Apoyo de la UNT`} />

        <div className="mt-12">
          <a
            href={mapaProcesos}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-xl border border-gray-200 shadow-sm overflow-hidden bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
            title="Abrir el organigrama en tamaño completo"
          >
            <img
              src={mapaProcesos}
              alt={`Organigrama estructural del ${site.denominacion}`}
              loading="lazy"
              className="w-full h-auto object-contain"
            />
          </a>
          <p className="text-center text-xs text-gray-500 mt-3">
            Haz clic en la imagen para verla en tamaño completo.
          </p>
        </div>
      </div>
    </div>
  );
}