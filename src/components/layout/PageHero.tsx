import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronRight, Home, type LucideIcon } from 'lucide-react';

export interface Breadcrumb {
  label: string;
  to?: string;
}

interface PageHeroProps {
  title: React.ReactNode;
  subtitle?: string;
  breadcrumbs?: Breadcrumb[];
  icon?: LucideIcon;
}

export default function PageHero({ title, subtitle, breadcrumbs = [], icon: Icon }: PageHeroProps) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <div className="relative bg-primary text-white overflow-hidden">
      {/* ── Fondo: patrón de puntos + formas ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Grid de puntos SVG */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>

        {/* Bloque naranja diagonal */}
        <div
          className="absolute -right-20 top-0 bottom-0 w-1/3 bg-gold/10"
          style={{ clipPath: 'polygon(25% 0%, 100% 0%, 100% 100%, 0% 100%)' }}
        />

        {/* Círculos decorativos */}
        <motion.div
          animate={prefersReducedMotion ? undefined : { scale: [1, 1.08, 1], opacity: [0.08, 0.14, 0.08] }}
          transition={prefersReducedMotion ? undefined : { duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-16 -right-16 w-80 h-80 rounded-full border-2 border-gold/30 opacity-10"
        />
        <div className="absolute top-4 right-10 w-16 h-16 rounded-full bg-gold/15" />
        <div className="absolute bottom-2 left-1/3 w-8 h-8 rounded-full bg-white/10" />

        {/* Barra izquierda naranja gruesa */}
        <div className="absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b from-gold via-gold/70 to-transparent" />
      </div>

      <div className="relative container mx-auto px-4 md:px-8 py-10 md:py-16">
        {/* Breadcrumb */}
        {breadcrumbs.length > 0 && (
          <motion.nav
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35 }}
            className="flex items-center gap-1.5 text-white/50 text-xs font-medium mb-5 flex-wrap"
            aria-label="Breadcrumb"
          >
            <Link to="/" className="flex items-center gap-1 hover:text-gold transition-colors">
              <Home className="w-3 h-3" />
              <span>Inicio</span>
            </Link>
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                <ChevronRight className="w-3 h-3 text-white/25" />
                {crumb.to && idx < breadcrumbs.length - 1 ? (
                  <Link to={crumb.to} className="hover:text-gold transition-colors">{crumb.label}</Link>
                ) : (
                  <span className="text-white/80 font-semibold">{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </motion.nav>
        )}

        <div className="flex items-center gap-6">
          {/* Ícono con glow */}
          {Icon && (
            <motion.div
              initial={{ opacity: 0, rotate: -10, scale: 0.7 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              transition={{ duration: 0.5, type: 'spring' }}
              className="hidden md:flex shrink-0 w-20 h-20 rounded-2xl items-center justify-center relative"
              style={{
                background: 'linear-gradient(135deg, rgba(230,173,9,0.25) 0%, rgba(230,173,9,0.08) 100%)',
                border: '1px solid rgba(230,173,9,0.35)',
                boxShadow: '0 0 30px rgba(230,173,9,0.15)',
              }}
            >
              <Icon className="w-10 h-10 text-gold" />
            </motion.div>
          )}

          <div className="flex-1">
            {/* Línea naranja animada */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="w-16 h-[3px] bg-gold rounded-full mb-4 origin-left"
            />

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="text-4xl md:text-5xl lg:text-6xl font-display font-black tracking-tight text-white leading-tight"
            >
              {title}
            </motion.h1>

            {subtitle && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.28 }}
                className="mt-4 text-white/65 font-body text-base md:text-lg max-w-2xl leading-relaxed"
              >
                {subtitle}
              </motion.p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
