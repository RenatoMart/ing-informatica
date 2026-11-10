import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FlaskConical, Utensils } from 'lucide-react';
import { SectionTitle } from '../../components/ui/SectionTitle';
import EnConstruccion from '../../components/layout/EnConstruccion';
import { laboratorios, laboratoriosFotos, laboratoriosPortada } from '@profile/content/laboratorios';

export default function Laboratorios() {
  const totalLabs = laboratorios.filter((l) => l.tipo === 'Laboratorio').length;
  const totalTalleres = laboratorios.length - totalLabs;
  const [foto, setFoto] = useState(0);
  const resumen = [
    totalLabs > 0 && `${totalLabs} ${totalLabs === 1 ? 'laboratorio' : 'laboratorios'}`,
    totalTalleres > 0 && `${totalTalleres} ${totalTalleres === 1 ? 'taller' : 'talleres'}`,
  ].filter(Boolean).join(' y ');

  useEffect(() => {
    if (laboratoriosFotos.length < 2) return;
    // Sin auto-rotación si el sistema pide reducir movimiento.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = setInterval(() => setFoto((i) => (i + 1) % laboratoriosFotos.length), 4000);
    return () => clearInterval(id);
  }, []);

  if (laboratorios.length === 0 && laboratoriosFotos.length === 0) {
    return <EnConstruccion titulo="Labora**torios**" descripcion="Estamos preparando la información de los laboratorios y talleres de la escuela." />;
  }

  return (
    <>
      {/* Portada: la foto manda; el texto se apoya en un degradado azul institucional */}
      <section className="relative isolate overflow-hidden bg-primary">
        {laboratoriosFotos.map((f, i) => (
          <img
            key={f.src}
            src={f.src}
            alt={f.alt}
            aria-hidden={i !== foto}
            loading={i === 0 ? 'eager' : 'lazy'}
            className={`absolute inset-0 -z-10 h-full w-full object-cover transition-opacity duration-1000 ${i === foto ? 'opacity-100' : 'opacity-0'}`}
            style={{ objectPosition: f.position ?? 'center' }}
          />
        ))}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary via-primary/85 to-primary/10 md:to-transparent" />
        <div className="container mx-auto px-4 md:px-8 py-20 md:py-36 lg:py-44">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-xl"
          >
            <div className="w-10 h-0.5 bg-gold rounded-full mb-4" />
            <h2 className="font-display font-black text-white text-3xl md:text-5xl leading-tight">
              Labora<span className="text-gold">torios</span>
            </h2>
            <p className="mt-4 text-white/85 text-base md:text-lg leading-relaxed">
              {resumen ? `La escuela cuenta con ${resumen} para las prácticas de la carrera.` : 'Ambientes para la formación práctica y la investigación.'}
            </p>
          </motion.div>
        </div>
        {laboratoriosPortada.pie && <p className="absolute bottom-3 right-4 text-[11px] text-white/70 hidden sm:block">{laboratoriosPortada.pie}</p>}
        {laboratoriosFotos.length > 1 && (
          <div className="absolute bottom-3 left-4 md:left-8 flex gap-2" role="group" aria-label="Fotos de los laboratorios">
            {laboratoriosFotos.map((f, i) => (
              <button
                key={f.src}
                type="button"
                onClick={() => setFoto(i)}
                aria-label={`Ver foto ${i + 1} de ${laboratoriosFotos.length}`}
                aria-pressed={i === foto}
                className="h-11 w-8 flex items-center justify-center focus:outline-none group"
              >
                <span className={`h-1.5 rounded-full transition-all ${i === foto ? 'w-8 bg-gold' : 'w-4 bg-white/60 group-hover:bg-white'}`} />
              </button>
            ))}
          </div>
        )}
      </section>

      {laboratorios.length > 0 && <div className="bg-white py-16 md:py-20">
        <div className="container mx-auto px-4 md:px-8">
          <SectionTitle
            title="Nuestros **ambientes**"
            subtitle="Laboratorios y talleres disponibles para la formación práctica y la investigación."
            center
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto mt-12">
            {laboratorios.map((lab, idx) => {
              const Icono = lab.tipo === 'Taller' ? Utensils : FlaskConical;
              return (
                <motion.article
                  key={lab.nombre}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: (idx % 2) * 0.08, duration: 0.35 }}
                  className="group flex overflow-hidden rounded-xl border border-gray-100 border-l-4 border-l-gold bg-white shadow-sm hover:shadow-md hover:border-gold/40 transition"
                >
                  {lab.imagen && (
                    <img src={lab.imagen} alt={lab.nombre} loading="lazy" className="w-32 object-cover shrink-0" />
                  )}
                  <div className="flex items-start gap-4 p-5">
                    <div className="w-11 h-11 shrink-0 rounded-xl bg-primary flex items-center justify-center group-hover:bg-gold transition-colors">
                      <Icono className="w-5 h-5 text-white" aria-hidden="true" />
                    </div>
                    <div>
                      <span className="block text-[10px] font-black uppercase tracking-[0.15em] text-gold">{lab.tipo}</span>
                      <h3 className="font-display font-bold text-primary text-base leading-snug">{lab.nombre}</h3>
                      {lab.descripcion && <p className="mt-1.5 text-sm text-gray-500 leading-relaxed">{lab.descripcion}</p>}
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </div>
      </div>}
    </>
  );
}
