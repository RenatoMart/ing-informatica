import React from 'react';
import { motion } from 'framer-motion';
import { User, Check, FlaskConical, BadgeCheck } from 'lucide-react';

/**
 * DocenteCard — Tarjeta con volteo 3D (flip).
 * Frente: cargo (grado) · línea separadora · nombre · curso principal.
 * Reverso (al hacer hover o enfocar con teclado): sus especialidades.
 * El flip es solo visual; ambas caras viven en el DOM, así los lectores de
 * pantalla acceden a todo. Respeta prefers-reduced-motion (flip instantáneo).
 */
interface Docente {
  grado: string;
  nombre: string;
  cursoPrincipal: string;
  foto?: string | null;
  /** CSS object-position de la foto (ej. 'center 25%'). Opcional: cada foto
   *  puede necesitar un encuadre distinto. Por defecto 'center 25%'. */
  fotoPosicion?: string;
  especialidades?: string[];
  investigador?: boolean;
  categoriaInvestigacion?: string | null;
  condicion?: string | null;
}

export default function DocenteCard({ docente }: { docente: Docente }) {
  const especialidades = docente.especialidades?.length
    ? docente.especialidades
    : [docente.cursoPrincipal].filter(Boolean);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
      tabIndex={0}
      aria-label={`${docente.grado} ${docente.nombre}. Curso principal: ${docente.cursoPrincipal}. Enfoca o pasa el cursor para ver sus especialidades.`}
      className="group h-[340px] rounded-2xl outline-none [perspective:1200px] focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
    >
      <div className="relative h-full w-full transition-transform duration-1000 ease-out [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)] group-focus-visible:[transform:rotateY(180deg)]">

        {/* ── FRENTE ── */}
        <div className="absolute inset-0 [backface-visibility:hidden] bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          {/* Foto de portada: ocupa todo el ancho de la franja superior */}
          <div className="relative h-52 shrink-0 overflow-hidden bg-primary rounded-t-2xl border-2 border-primary">
            {docente.foto ? (
              <img src={docente.foto} alt={docente.nombre} loading="lazy" className="w-full h-full object-cover" style={{ objectPosition: docente.fotoPosicion ?? 'center 25%' }} />
            ) : (
              <>
                <div className="absolute inset-0 opacity-[0.06]"
                  style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '16px 16px' }}
                />
                <div className="w-full h-full flex items-end justify-center">
                  <User className="w-20 h-20 text-white/25 -mb-2" />
                </div>
              </>
            )}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
          </div>

          {/* Cargo · línea separadora · nombre · curso principal */}
          <div className="flex flex-col flex-1 px-4 pt-3 pb-3 text-center justify-start overflow-hidden">
            <p className="text-gold text-[10px] font-black uppercase tracking-[0.08em]">
              {docente.grado}
            </p>
            <div className="border-t border-gray-100 my-1.5" />
            <h4 className="font-display font-bold text-primary text-sm leading-tight mb-1">
              {docente.nombre}
            </h4>
            <p className="text-gray-600 text-xs leading-snug">
              {docente.cursoPrincipal}
            </p>
          </div>
        </div>

        {/* ── REVERSO ── */}
        <div className="absolute inset-0 [transform:rotateY(180deg)] [backface-visibility:hidden] bg-primary rounded-2xl shadow-lg overflow-hidden flex flex-col p-5 text-white">
          <div className="text-center shrink-0">
            <p className="text-gold text-[10px] font-black uppercase tracking-[0.2em]">
              {docente.grado}
            </p>
            <h4 className="font-display font-bold text-sm leading-tight mt-1">
              {docente.nombre}
            </h4>

            {/* Etiquetas: condición (nombrado/contratado), investigador y su categoría */}
            {(docente.condicion || docente.investigador) && (
              <div className="flex flex-wrap justify-center gap-1.5 mt-2.5">
                {docente.condicion && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/15 border border-white/25 text-white text-[9px] font-black uppercase tracking-wide px-2 py-0.5">
                    <BadgeCheck className="w-3 h-3" aria-hidden="true" />
                    {docente.condicion}
                  </span>
                )}
                {docente.investigador && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gold text-primary text-[9px] font-black uppercase tracking-wide px-2 py-0.5">
                    <FlaskConical className="w-3 h-3" aria-hidden="true" />
                    Investigador
                  </span>
                )}
                {docente.investigador && docente.categoriaInvestigacion && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/10 border border-gold/40 text-gold text-[9px] font-bold px-2 py-0.5">
                    {docente.categoriaInvestigacion}
                  </span>
                )}
              </div>
            )}

            <div className="border-t border-white/20 my-3" />
            <p className="text-gold text-[10px] font-black uppercase tracking-[0.18em] mb-2">
              Especialidades
            </p>
          </div>
          <ul className="space-y-2 overflow-y-auto overscroll-contain custom-scrollbar text-left flex-1 pr-1">
            {especialidades.map((esp, i) => (
              <li key={i} className="flex gap-2 text-xs text-white/90 leading-snug">
                <Check className="w-3.5 h-3.5 text-gold shrink-0 mt-0.5" strokeWidth={3} />
                <span>{esp}</span>
              </li>
            ))}
          </ul>
        </div>

      </div>
    </motion.div>
  );
}
