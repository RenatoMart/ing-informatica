import React from 'react';
import { informacionContacto } from '@profile/content/contacto';

export default function MapaUbicacion() {
  return (
    <div className="w-full h-64 md:h-full min-h-[400px] bg-gray-200 relative overflow-hidden">
      <iframe
        title={informacionContacto.mapaTitulo}
        src={informacionContacto.mapaEmbedUrl}
        className="absolute top-0 left-0 w-full h-full border-0"
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      ></iframe>
    </div>
  );
}