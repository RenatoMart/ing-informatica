import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

/**
 * SectionTitle - Título de sección más expresivo y energético.
 * Props:
 *  - title: string — puede incluir `**palabra**` para resaltar en naranja
 *  - subtitle: string
 *  - center: boolean
 *  - badge: string — texto pequeño de etiqueta encima del título (opcional)
 *  - className: string
 */
interface SectionTitleProps {
  title: string;
  subtitle?: string;
  center?: boolean;
  badge?: string;
  className?: string;
}

export function SectionTitle({ title, subtitle, center = false, badge, className }: SectionTitleProps) {
  // Procesa **texto** → span naranja
  const renderTitle = (text: string) => {
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, i) =>
      i % 2 === 1
        ? <span key={i} className="text-gold">{part}</span>
        : part
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className={clsx('mb-10', center && 'text-center flex flex-col items-center', className)}
    >
      {/* Badge opcional */}
      {badge && (
        <span className="inline-block mb-3 text-xs font-black uppercase tracking-[0.18em] text-gold bg-gold/10 px-3 py-1 rounded-full border border-gold/20">
          {badge}
        </span>
      )}

      <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-black text-primary leading-tight mb-3">
        {renderTitle(title)}
      </h2>

      {/* Línea decorativa doble */}
      <div className={clsx('flex items-center gap-1 mb-4', center && 'justify-center')}>
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="h-1 w-14 bg-gold rounded-full origin-left"
        />
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, delay: 0.1, ease: 'easeOut' }}
          className="h-1 w-4 bg-primary rounded-full origin-left"
        />
      </div>

      {subtitle && (
        <p className="text-gray-600 font-body text-base md:text-lg max-w-2xl leading-relaxed">
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}