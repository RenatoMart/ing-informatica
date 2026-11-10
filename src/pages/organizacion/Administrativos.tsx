import React from 'react';
import { User } from 'lucide-react';
import EnConstruccion from '../../components/layout/EnConstruccion';
import { SectionTitle } from '../../components/ui/SectionTitle';
import { site } from '@/profile';
import { administrativos } from '@profile/content/administrativos';

/**
 * Personal administrativo: tarjetas altas con foto a todo el marco; cargo, nombre y
 * dependencia sobre un degradado azul al pie. Sin foto, fondo azul con silueta.
 */
export default function Administrativos() {
  if (administrativos.length === 0) return <EnConstruccion titulo="Personal administrativo" />;
  return (
    <div className="bg-white py-16 md:py-20">
      <div className="container mx-auto px-4 md:px-8">
        <SectionTitle
          title="Personal **Administrativo**"
          subtitle={`Equipo técnico y administrativo que da soporte a la ${site.programa.nombre}.`}
          center
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 mt-12 max-w-7xl mx-auto">
          {administrativos.map((p, i) => (
            <article key={`${p.nombre}-${i}`} className="relative h-[390px] overflow-hidden rounded-2xl bg-primary shadow-sm">
              {p.foto ? (
                <img
                  src={p.foto}
                  alt={p.nombre}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ objectPosition: p.fotoPosicion ?? 'center 20%' }}
                />
              ) : (
                <div className="absolute inset-0 flex items-start justify-center pt-[18%]" aria-hidden="true">
                  <div
                    className="absolute inset-0 opacity-[0.06]"
                    style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '16px 16px' }}
                  />
                  <User className="w-20 h-20 text-white/20" />
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-primary via-primary/75 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 text-white text-center">
                {p.cargo && <p className="text-gold text-[10px] font-black uppercase tracking-[0.08em]">{p.cargo}</p>}
                <h3 className="font-display font-bold text-sm leading-tight mt-1">{p.nombre}</h3>
                {p.area && <p className="text-white/85 text-xs leading-snug mt-1">{p.area}</p>}
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
