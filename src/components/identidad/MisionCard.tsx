import React from 'react';
import { motion } from 'framer-motion';

/**
 * MisionCard — Tarjeta premium para Misión / Visión.
 * Diseño: fondo azul oscuro institucional, ícono con glow naranja,
 * barra lateral de acento, tipografía en blanco.
 */
interface MisionCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
}

export default function MisionCard({ title, description, icon }: MisionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.35 }}
      className="h-full"
    >
      <div className="h-full relative bg-white border border-gray-100 rounded-2xl overflow-hidden p-8 flex flex-col shadow-lg hover:shadow-xl transition-shadow">
        {/* Acento superior */}
        <div className="absolute left-0 top-0 right-0 h-1 bg-gradient-to-r from-primary to-gold" />

        {/* Ícono */}
        {icon && (
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 relative"
            style={{
              background: 'rgba(230,173,9,0.15)',
              border: '1px solid rgba(230,173,9,0.3)',
              boxShadow: '0 0 20px rgba(230,173,9,0.12)',
            }}
          >
            {icon}
          </div>
        )}

        {/* Línea naranja */}
        <div className="w-8 h-0.5 bg-gold rounded-full mb-4" />

        {/* Título */}
        <h3 className="text-xl md:text-2xl font-display font-black text-primary mb-4 leading-tight">
          {title}
        </h3>

        {/* Descripción */}
        <p className="text-gray-600 font-body text-sm md:text-base leading-relaxed flex-1">
          {description}
        </p>

        {/* Círculo decorativo */}
        <div className="absolute -bottom-6 -right-6 w-28 h-28 rounded-full bg-gray-50 pointer-events-none" />
      </div>
    </motion.div>
  );
}
