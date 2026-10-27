import React from 'react';
import { ExternalLink, Globe2, Landmark } from 'lucide-react';
import { SectionTitle } from '../../components/ui/SectionTitle';
import { Card } from '../../components/ui/Card';
import { conveniosOrni } from '@profile/content/investigacion';

const linkExterno = 'inline-flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2';

export default function Convenios() {
  return (
    <div className="bg-white py-16 md:py-20">
      <div className="container mx-auto px-4 md:px-8">
        <SectionTitle
          title="Convenios **Institucionales**"
          center
          subtitle="Alianzas estratégicas de la Universidad Nacional de Trujillo que potencian el desarrollo académico y las prácticas profesionales. Fuente: Oficina de Relaciones Nacionales e Internacionales (ORNI)."
        />

        {/* Nacionales */}
        <div className="max-w-6xl mx-auto mt-12">
          <h3 className="flex items-center gap-2 text-2xl font-display font-bold text-primary mb-6">
            <Landmark className="w-6 h-6 text-gold" aria-hidden="true" /> Convenios nacionales
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {conveniosOrni.nacionales.map((c) => (
              <a key={c.nombre} href={c.url} target="_blank" rel="noopener noreferrer" className="block h-full rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2">
                <Card className="h-full p-6 flex flex-col hover:border-gold/50 transition-colors">
                  <h4 className="text-lg font-display font-bold text-primary">{c.nombre}</h4>
                  <p className="text-gray-600 font-body text-sm mt-2 mb-4 flex-grow">{c.descripcion}</p>
                  <span className="text-xs font-bold text-primary inline-flex items-center gap-1.5">
                    Ver convenios <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                  </span>
                </Card>
              </a>
            ))}
          </div>
        </div>

        {/* Internacionales */}
        <div className="max-w-6xl mx-auto mt-14">
          <h3 className="flex items-center gap-2 text-2xl font-display font-bold text-primary mb-6">
            <Globe2 className="w-6 h-6 text-gold" aria-hidden="true" /> Convenios internacionales
          </h3>
          <ul className="flex flex-wrap gap-2">
            {conveniosOrni.internacionales.map((c) => (
              <li key={c.pais}>
                <a
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${linkExterno} px-4 py-2 rounded-full bg-white text-primary text-sm font-semibold border border-gray-200 hover:border-gold/50 transition-colors`}
                >
                  {c.pais}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="max-w-6xl mx-auto mt-14 flex flex-wrap gap-4 text-sm font-semibold">
          <a href={conveniosOrni.portal} target="_blank" rel="noopener noreferrer" className={`${linkExterno} text-primary hover:underline`}>
            Portal de convenios ORNI <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
          </a>
          <a href={conveniosOrni.becasYRedes} target="_blank" rel="noopener noreferrer" className={`${linkExterno} text-primary hover:underline`}>
            Becas y redes <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
          </a>
          <a href={conveniosOrni.comoSuscribir} target="_blank" rel="noopener noreferrer" className={`${linkExterno} text-primary hover:underline`}>
            Cómo suscribir un convenio con la UNT <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
          </a>
        </div>
      </div>
    </div>
  );
}
