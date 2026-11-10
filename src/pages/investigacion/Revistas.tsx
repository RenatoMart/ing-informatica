import React from 'react';
import { ExternalLink, Mail, MapPin } from 'lucide-react';
import { SectionTitle } from '../../components/ui/SectionTitle';
import { Card } from '../../components/ui/Card';
import { revistas } from '@profile/content/investigacion';

export default function Revistas() {
  return (
    <div className="bg-white py-16 md:py-20">
      <div className="container mx-auto px-4 md:px-8">
        <SectionTitle
          title="Revistas **Científicas**"
          center
          subtitle="Publicaciones periódicas de la Universidad Nacional de Trujillo vinculadas a la Informática."
        />

        <div className="flex flex-col gap-8 max-w-4xl mx-auto mt-12">
          {revistas.map((revista) => (
            <Card key={revista.nombre} className="p-8">
              <h3 className="text-2xl font-display font-bold text-primary">{revista.nombre}</h3>
              <p className="text-sm font-bold text-gold-deep mt-1">{revista.editorial}</p>
              <p className="text-gray-600 font-body text-sm leading-relaxed mt-4">{revista.descripcion}</p>

              <div className="mt-6 bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-black uppercase tracking-wider text-primary mb-1">Número actual</p>
                <p className="text-sm font-bold text-gray-800">{revista.numeroActual.titulo}</p>
                <p className="text-sm text-gray-600 mt-1">{revista.numeroActual.tema}</p>
                <ul className="mt-3 space-y-1.5 list-disc pl-5 text-sm text-gray-700">
                  {revista.numeroActual.articulos.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {revista.enlaces.map((e) => (
                  <a
                    key={e.etiqueta}
                    href={e.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
                  >
                    {e.etiqueta} <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                  </a>
                ))}
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-4 text-sm text-gray-600">
                <a href={`mailto:${revista.correo}`} className="inline-flex items-center gap-2 hover:text-primary transition-colors">
                  <Mail className="w-4 h-4" aria-hidden="true" /> {revista.correo}
                </a>
                <span className="inline-flex items-center gap-2">
                  <MapPin className="w-4 h-4" aria-hidden="true" /> {revista.direccion}
                </span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
