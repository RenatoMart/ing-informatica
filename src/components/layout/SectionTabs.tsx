import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import clsx from 'clsx';
import useHeaderHeight from '../../hooks/useHeaderHeight';
import type { NavLeaf } from '@/navigation';

/**
 * Barra de sub-navegación (pestañas) compartida por las subpáginas de una misma
 * sección. Características:
 *  - Enlaces desde la fuente única de navegación (navigation.js).
 *  - Sticky justo debajo de la cabecera/navbar (offset calculado en tiempo real).
 *  - Indicador (subrayado) que se DESLIZA entre pestañas con layout animation.
 *  - Estado activo basado en la URL; la raíz de la sección activa la 1ª pestaña.
 *  - Accesible: foco de teclado visible, aria-current y respeto a reduced-motion.
 */
export default function SectionTabs({ links }: { links: NavLeaf[] }) {
  const headerHeight = useHeaderHeight();
  const prefersReducedMotion = useReducedMotion();
  const { pathname } = useLocation();

  // La subsección activa es la que coincide con la URL; si estamos en la raíz de
  // la sección (no coincide ninguna), se activa la primera pestaña.
  const activePath = links.some((link) => link.path === pathname)
    ? pathname
    : links[0]?.path;

  return (
    <div
      className="sticky z-30 bg-white border-b border-gray-200 shadow-sm"
      style={{ top: headerHeight }}
    >
      <div className="container mx-auto px-4 md:px-8 relative">
        {/* Fade en el borde derecho: pista de que hay más pestañas al deslizar
            (solo en móvil, donde es probable el desbordamiento). */}
        <div
          aria-hidden="true"
          className="md:hidden pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-white to-transparent z-10"
        />
        <nav
          className="flex overflow-x-auto hide-scrollbar gap-1"
          aria-label="Navegación de la sección"
        >
          {links.map((link) => {
            const isActive = link.path === activePath;
            return (
              <Link
                key={link.path}
                to={link.path}
                aria-current={isActive ? 'page' : undefined}
                className={clsx(
                  'relative px-4 py-4 text-sm font-semibold whitespace-nowrap transition-colors',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-inset rounded-sm',
                  isActive ? 'text-primary' : 'text-gray-500 hover:text-gray-700'
                )}
              >
                {link.name}
                {isActive && (
                  <motion.div
                    layoutId="sectionTabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full"
                    initial={false}
                    transition={
                      prefersReducedMotion
                        ? { duration: 0 }
                        : { type: 'spring', stiffness: 300, damping: 30 }
                    }
                  />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
