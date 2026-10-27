import React from 'react';
import { SectionTitle } from '../../components/ui/SectionTitle';
import PublicacionItem from '../../components/investigacion/PublicacionItem';
import { publicaciones } from '@profile/content/investigacion';

export default function Publicaciones() {
  return (
    <div className="bg-white py-16 md:py-20">
      <div className="container mx-auto px-4 md:px-8">
        <SectionTitle title="Publicaciones **Científicas**" center subtitle="Artículos, libros y material académico generado por nuestra comunidad." />
        
        <div className="flex flex-col gap-6 max-w-4xl mx-auto mt-12">
          {publicaciones.map((pub, idx) => (
            <PublicacionItem key={idx} publicacion={pub} index={idx} />
          ))}
        </div>
      </div>
    </div>
  );
}