import React from 'react';
import { motion } from 'framer-motion';
import { SectionTitle } from '../../components/ui/SectionTitle';
import { tramites } from '@profile/content/academico';
import { GraduationCap, Award, Download, Check } from 'lucide-react';

export default function Titulacion() {
  return (
    <div className="bg-white py-16 md:py-20">
      <div className="container mx-auto px-4 md:px-8">
        <SectionTitle
          title="Grados y **Títulos**"
          subtitle="Requisitos y modalidades para obtener tu grado de bachiller y título profesional."
          center
        />

        <div className="max-w-6xl mx-auto mt-12 grid grid-cols-1 md:grid-cols-2 gap-7">
          {tramites.map((tramite, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.12, duration: 0.4 }}
              className="group"
            >
              <div className="h-full flex flex-col bg-white rounded-2xl border border-gray-100 hover:border-gold/30 hover:shadow-[0_8px_32px_rgba(230,173,9,0.1)] transition duration-300 overflow-hidden">
                {/* Cabecera azul */}
                <div className="bg-primary p-7 relative overflow-hidden">
                  <div className="absolute inset-0 opacity-[0.05]"
                    style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '18px 18px' }}
                  />
                  <div className="relative flex items-start gap-4">
                    <div className="w-14 h-14 bg-gold/20 border border-gold/30 rounded-2xl flex items-center justify-center shrink-0"
                      style={{ boxShadow: '0 0 20px rgba(230,173,9,0.15)' }}>
                      {idx === 0
                        ? <GraduationCap className="w-7 h-7 text-gold" />
                        : <Award className="w-7 h-7 text-gold" />
                      }
                    </div>
                    <div>
                      <div className="w-6 h-0.5 bg-gold rounded-full mb-2" />
                      <h3 className="text-xl font-display font-black text-white leading-tight">
                        {tramite.titulo}
                      </h3>
                    </div>
                  </div>
                </div>

                {/* Cuerpo */}
                <div className="p-7 flex flex-col flex-1">
                  <p className="text-gray-500 text-sm leading-relaxed mb-6">
                    {tramite.descripcion}
                  </p>

                  {/* Requisitos */}
                  <div className="bg-gray-50 rounded-2xl p-5 flex-1">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 mb-4">
                      Requisitos Principales
                    </h4>
                    <ul className="space-y-3">
                      {tramite.requisitos.map((req, ridx) => (
                        <li key={ridx} className="flex items-start gap-3 text-sm text-gray-600">
                          <span className="w-5 h-5 rounded-full bg-gold/15 flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="w-3 h-3 text-gold" />
                          </span>
                          <span className="leading-relaxed">{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA */}
                  <a
                    href={tramite.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gold hover:bg-gold-deep text-primary font-black rounded-xl transition-colors text-sm group-hover:shadow-[0_4px_20px_rgba(230,173,9,0.4)]"
                  >
                    <Download className="w-4 h-4" />
                    Descargar Requisitos
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}