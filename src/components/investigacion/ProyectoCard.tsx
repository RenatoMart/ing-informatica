import React from 'react';
import { motion } from 'framer-motion';
import { Users, Calendar } from 'lucide-react';

/**
 * ProyectoCard — Tarjeta premium para proyectos de investigación.
 * Franja de color según estado, año destacado, lista de investigadores limpia.
 */
interface Proyecto {
  estado: string;
  año: number | string;
  titulo: string;
  descripcion: string;
  investigadores: string[];
}

export default function ProyectoCard({ proyecto }: { proyecto: Proyecto }) {
  const isActive = proyecto.estado === 'En ejecución';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.3 }}
      className="group h-full"
    >
      <div className="h-full flex flex-col bg-white rounded-2xl border border-gray-100 hover:border-gold/30 hover:shadow-lg transition duration-300 overflow-hidden">
        {/* Franja superior de estado */}
        <div className={`h-1.5 w-full ${isActive ? 'bg-emerald-400' : 'bg-gray-300'}`} />

        <div className="p-6 flex flex-col flex-1">
          {/* Estado + año */}
          <div className="flex items-center justify-between mb-4">
            <span className={`inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full ${
              isActive
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-gray-100 text-gray-500 border border-gray-200'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-gray-400'}`} />
              {proyecto.estado}
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-gray-600 font-semibold">
              <Calendar className="w-3 h-3" />
              {proyecto.año}
            </span>
          </div>

          {/* Título */}
          <h3 className="font-display font-bold text-primary text-base leading-snug mb-3 group-hover:text-gold transition-colors">
            {proyecto.titulo}
          </h3>

          {/* Descripción */}
          <p className="text-gray-500 text-sm leading-relaxed flex-1 mb-5">
            {proyecto.descripcion}
          </p>

          {/* Investigadores */}
          <div className="bg-gray-50 rounded-xl p-4 mt-auto">
            <div className="flex items-center gap-1.5 mb-2">
              <Users className="w-3 h-3 text-gold" />
              <span className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-600">Investigadores</span>
            </div>
            <ul className="space-y-1">
              {proyecto.investigadores.map((inv, idx) => (
                <li key={idx} className="text-xs text-gray-600 font-medium flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-gold shrink-0" />
                  {inv}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
}