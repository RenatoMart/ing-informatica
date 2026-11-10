import React from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Mail, User } from 'lucide-react';

export interface AutoridadFichaDatos {
  cargo: string;
  nombre: string;
  correo?: string;
  /** Reseña corta; se muestra si no hay lista de formación. */
  bio?: string;
  /** Grados y títulos, uno por línea (p. ej. «Ingeniero…, Universidad…, (fecha)»). */
  formacion?: string[];
  foto?: string | null;
  /** Encuadre de la foto, p. ej. '50% 20%'. */
  fotoPosicion?: string;
}

/**
 * Ficha de una autoridad: texto a la izquierda (cargo, nombre, formación académica, correo) y la foto a todo el
 * alto a la derecha. En pantallas pequeñas la foto pasa arriba. Sin foto, el recuadro azul lleva la silueta.
 */
export default function AutoridadFicha({ autoridad }: { autoridad: AutoridadFichaDatos }) {
  const grados = (autoridad.formacion ?? []).map((g) => g.trim()).filter(Boolean);
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="grid overflow-hidden rounded-2xl border border-primary/25 bg-white shadow-sm md:grid-cols-[minmax(0,1fr)_20rem]"
    >
      <div className="order-2 flex flex-col justify-center p-7 sm:p-9 md:order-1 md:p-12">
        <p className="text-xs font-extrabold uppercase leading-relaxed tracking-[0.14em] text-gold-deep">{autoridad.cargo}</p>
        <h3 className="mt-3 font-display text-2xl font-bold leading-tight text-primary md:text-[2rem]">{autoridad.nombre}</h3>
        <div className="my-5 h-0.5 w-12 rounded bg-gold" aria-hidden="true" />

        {grados.length > 0 ? (
          <>
            <p className="mb-3 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-primary">
              <GraduationCap className="h-4 w-4 text-gold" aria-hidden="true" /> Formación académica
            </p>
            <ul className="space-y-2 text-sm leading-relaxed text-gray-700">
              {grados.map((g, i) => (
                <li key={i} className="flex gap-2.5"><span className="mt-[0.55rem] h-1 w-1 shrink-0 rounded-full bg-gold" aria-hidden="true" />{g}</li>
              ))}
            </ul>
          </>
        ) : autoridad.bio ? (
          <p className="text-sm leading-relaxed text-gray-700">{autoridad.bio}</p>
        ) : null}

        {autoridad.correo && (
          <a href={`mailto:${autoridad.correo}`} className="mt-6 inline-flex items-center gap-2 self-start text-sm font-bold text-primary transition-colors hover:text-gold-deep">
            <Mail className="h-4 w-4 text-gold" aria-hidden="true" /> {autoridad.correo}
          </a>
        )}
      </div>

      <div className="relative order-1 aspect-[4/3] bg-primary md:order-2 md:aspect-auto md:min-h-[26rem]">
        {autoridad.foto ? (
          <img src={autoridad.foto} alt={autoridad.nombre} loading="lazy" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: autoridad.fotoPosicion ?? '50% 20%' }} />
        ) : (
          <div className="absolute inset-0 grid place-items-center">
            <User className="h-28 w-28 text-white/25" aria-hidden="true" />
          </div>
        )}
      </div>
    </motion.article>
  );
}
