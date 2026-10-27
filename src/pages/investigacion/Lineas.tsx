import React from 'react';
import { motion } from 'framer-motion';
import { SectionTitle } from '../../components/ui/SectionTitle';
import { lineasInvestigacion } from '@profile/content/investigacion';

export default function Lineas() {
  return (
    <div className="bg-gray-50 py-16 md:py-20">
      <div className="container mx-auto px-4 md:px-8">
        <SectionTitle
          title="Líneas de **Investigación**"
          subtitle="Áreas prioritarias para la generación de conocimiento e innovación ambiental."
          center
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto mt-12">
          {lineasInvestigacion.map((linea, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.4 }}
              whileHover={{ y: -6 }}
              className="group h-full"
            >
              <div className="h-full bg-white rounded-2xl border border-gray-100 hover:border-gold/40 hover:shadow-[0_8px_32px_rgba(230,173,9,0.1)] transition duration-300 overflow-hidden flex flex-col">
                {/* Cabecera coloreada */}
                <div className="bg-primary px-6 pt-6 pb-8 relative overflow-hidden">
                  {/* Patrón de fondo */}
                  <div className="absolute inset-0 opacity-[0.06]"
                    style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '16px 16px' }}
                  />
                  {/* Número */}
                  <span className="absolute top-4 right-4 text-5xl font-display font-black text-white/10 leading-none select-none">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <div className="w-8 h-0.5 bg-gold rounded-full mb-3 relative" />
                  <h3 className="text-lg font-display font-black text-white leading-snug relative">
                    {linea.nombre}
                  </h3>
                </div>

                {/* Contenido */}
                <div className="p-6 flex flex-col flex-1">
                  <p className="text-gray-500 text-sm leading-relaxed flex-1 mb-5">
                    {linea.descripcion}
                  </p>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <span className="block text-[10px] font-black uppercase tracking-[0.15em] text-gray-600 mb-1">
                      Responsable de línea
                    </span>
                    <span className="text-sm font-bold text-primary">
                      {linea.responsable}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}