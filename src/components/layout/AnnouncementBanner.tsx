import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Megaphone, X, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { avisos as AVISOS } from '@profile/content/avisos';

export default function AnnouncementBanner() {
  const [visible, setVisible] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);

  // Sin avisos en el perfil: el banner no se muestra.
  if (AVISOS.length === 0) return null;

  const aviso = AVISOS[currentIdx];

  const handleNext = () => setCurrentIdx((prev) => (prev + 1) % AVISOS.length);

  return (
    <AnimatePresence>
      {visible && (
      <motion.div
        key="banner"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-gold text-primary overflow-hidden"
      >
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between gap-3 py-2.5">
            {/* Ícono + Texto */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Megaphone className="w-4 h-4 shrink-0" />
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIdx}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-2 min-w-0"
                >
                  <span className="text-sm font-medium truncate">
                    {aviso.texto}
                  </span>
                  {aviso.link && (
                    aviso.externo ? (
                      <a
                        href={aviso.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hidden sm:inline-flex items-center gap-0.5 text-primary font-extrabold text-sm underline underline-offset-2 shrink-0 hover:opacity-70 transition-opacity"
                      >
                        Ver más <ChevronRight className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      <Link
                        to={aviso.link}
                        className="hidden sm:inline-flex items-center gap-0.5 text-primary font-extrabold text-sm underline underline-offset-2 shrink-0 hover:opacity-70 transition-opacity"
                      >
                        Ver más <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    )
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Controles */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Indicadores de página */}
              <div className="hidden sm:flex items-center gap-1">
                {AVISOS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIdx(i)}
                    className="p-1.5 flex items-center justify-center"
                    aria-label={`Ir al aviso ${i + 1}`}
                    aria-current={i === currentIdx ? 'true' : undefined}
                  >
                    <span className={`block h-1.5 rounded-full transition-[width,background-color] ${i === currentIdx ? 'bg-primary w-3' : 'bg-primary/40 w-1.5'}`} />
                  </button>
                ))}
              </div>

              {AVISOS.length > 1 && (
                <button
                  onClick={handleNext}
                  className="text-primary/70 hover:text-primary transition-colors p-0.5"
                  aria-label="Siguiente aviso"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={() => setVisible(false)}
                className="text-primary/70 hover:text-primary transition-colors p-0.5 ml-1"
                aria-label="Cerrar aviso"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
      )}
    </AnimatePresence>
  );
}
