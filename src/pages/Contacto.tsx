import React from 'react';
import PageWrapper from '../components/layout/PageWrapper';
import PageHero from '../components/layout/PageHero';
import FormContacto from '../components/contacto/FormContacto';
import MapaUbicacion from '../components/contacto/MapaUbicacion';
import RedesSociales from '../components/contacto/RedesSociales';
import { informacionContacto } from '@profile/content/contacto';
import { Link } from 'react-router-dom';
import { useRegistrarVisita } from '../data/ConsultarInformacionController';
import { MessageSquare, MapPin, Phone, Mail } from 'lucide-react';

export default function Contacto() {
  useRegistrarVisita('contacto');
  return (
    <PageWrapper>
      <PageHero
        title="Contacto y Ubicación"
        subtitle="Estamos aquí para resolver tus dudas. Escríbenos o visítanos en nuestro campus."
        icon={MessageSquare}
        breadcrumbs={[{ label: 'Contacto' }]}
      />

      <div className="bg-gray-50 py-12 min-h-[100svh]">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col lg:flex-row border border-gray-100">
            
            {/* Info y Formulario */}
            <div className="w-full lg:w-1/2 p-8 md:p-12 flex flex-col">
              <h3 className="text-2xl font-display font-bold text-primary mb-8">Ponte en contacto</h3>
              
              <div className="space-y-6 mb-10">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center shrink-0 text-primary"><MapPin className="w-5 h-5" /></div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm mb-1 uppercase tracking-wider">Dirección</h4>
                    <p className="text-gray-600 text-sm leading-relaxed">{informacionContacto.direccion}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center shrink-0 text-primary"><Phone className="w-5 h-5" /></div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm mb-1 uppercase tracking-wider">Teléfonos</h4>
                    <p className="text-gray-600 text-sm">{informacionContacto.telefonos.join(' / ')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center shrink-0 text-primary"><Mail className="w-5 h-5" /></div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm mb-1 uppercase tracking-wider">Correo Institucional</h4>
                    <p className="text-gray-600 text-sm">{informacionContacto.correo}</p>
                  </div>
                </div>
              </div>

              <hr className="border-gray-100 mb-8" />
              
              <h4 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wider">Envíanos un mensaje</h4>
              <FormContacto />
              <p className="text-xs text-gray-500 mt-4">
                ¿Buscas algo en particular? <Link to="/buscar" className="font-semibold text-primary hover:text-gold transition-colors">Buscar en el sitio</Link>
              </p>
              <RedesSociales />
            </div>

            {/* Mapa de Ubicación */}
            <div className="w-full lg:w-1/2 bg-gray-100 flex">
              <MapaUbicacion />
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}