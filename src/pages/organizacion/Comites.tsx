import React from 'react';
import { Users } from 'lucide-react';
import AnchoredSection from '../../components/layout/AnchoredSection';
import EnConstruccion from '../../components/layout/EnConstruccion';
import { SectionTitle } from '../../components/ui/SectionTitle';
import { comites, type ComiteMiembro } from '@profile/content/comites';

/**
 * Página agrupada "Comités". El navbar muestra los comités por separado; todos
 * llevan aquí, a su ancla correspondiente (#calidad, #tutoria, ...). Cada comité
 * con integrantes se muestra como una cuadrícula de tarjetas (docentes y
 * representantes estudiantiles); los comités aún sin datos muestran el aviso
 * "En construcción". Todo el contenido vive en el perfil (@profile/content/comites).
 */
function Miembro({ miembro }: { miembro: ComiteMiembro }) {
  const principal = /^(Presidente|Presidenta|Responsable)$/.test(miembro.rol);
  return (
    <li className="flex items-start justify-between gap-4 py-3">
      <span className="font-display font-bold text-primary text-sm leading-snug">
        {miembro.grado ? `${miembro.grado} ` : ''}{miembro.nombre}
      </span>
      <span className={`shrink-0 text-[10px] font-black uppercase tracking-[0.08em] rounded-full px-2.5 py-1 ${principal ? 'bg-gold/20 text-gold-deep' : 'bg-gray-100 text-gray-600'}`}>
        {miembro.rol}
      </span>
    </li>
  );
}

export default function Comites() {
  return (
    <>
      {comites.map((comite, idx) => (
        <AnchoredSection key={comite.id} id={comite.id}>
          {comite.miembros.length > 0 ? (
            <div className={idx % 2 === 1 ? 'bg-gray-50' : 'bg-white'}>
              <div className="container mx-auto px-4 md:px-8 py-16 md:py-20">
                <SectionTitle title={comite.titulo} subtitle={comite.descripcion} center />
                {comite.resolucion && (
                  <p className="-mt-6 mb-8 text-center">
                    <span className="inline-block rounded-full bg-primary/10 text-primary text-xs font-bold px-3 py-1">{comite.resolucion}</span>
                  </p>
                )}
                <div className="max-w-3xl mx-auto rounded-2xl border border-gray-100 bg-white shadow-sm p-6 md:p-8">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <h3 className="font-display font-bold text-gold-deep text-xs uppercase tracking-[0.1em] inline-flex items-center gap-2">
                      <Users className="w-4 h-4" aria-hidden="true" /> Integrantes
                    </h3>
                    <span className="text-sm text-gray-500">{comite.miembros.length} {comite.miembros.length === 1 ? 'miembro' : 'miembros'}</span>
                  </div>
                  <ul className="divide-y divide-gray-100">
                    {comite.miembros.map((miembro, i) => (
                      <Miembro key={`${miembro.nombre}-${i}`} miembro={miembro} />
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <EnConstruccion titulo={comite.titulo} bg={idx % 2 === 1 ? 'bg-gray-50' : 'bg-white'} />
          )}
        </AnchoredSection>
      ))}
    </>
  );
}
