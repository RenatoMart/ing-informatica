import React from 'react';
import { urlApi } from '../../data/perfilRemoto';

/**
 * Muestra el cuerpo de una noticia escrito con formato sencillo (el que arma el panel):
 *   ## Título · ### Subtítulo · **negrita** · *cursiva* · [texto](enlace) · - lista · 1. lista numerada
 *   > cita · ![descripción](imagen "pie de foto")
 * Se construye con elementos de React (nunca innerHTML) y solo acepta enlaces e imágenes seguros: no hay forma de colar HTML ni scripts.
 */

const urlSegura = (u: string, imagen = false): string | null => {
  const v = u.trim();
  // Los archivos subidos desde el panel (/media/…) viven en la API, que puede estar en otro origen que el sitio.
  if (v.startsWith('/media/')) return urlApi + v;
  if (v.startsWith('/') && !v.startsWith('//')) return v;
  if (/^https?:\/\//i.test(v)) return v;
  if (!imagen && /^(mailto:|tel:)/i.test(v)) return v;
  return null;
};

const INLINE = /(\*\*[^*]+\*\*|\*[^*\s][^*]*\*|\[[^\]]+\]\([^)\s]+\))/g;

function enLinea(texto: string, clave: string): React.ReactNode[] {
  return texto.split(INLINE).filter(Boolean).map((p, i) => {
    const k = `${clave}-${i}`;
    if (p.startsWith('**') && p.endsWith('**') && p.length > 4) return <strong key={k} className="font-bold text-ink">{enLinea(p.slice(2, -2), k)}</strong>;
    if (p.startsWith('*') && p.endsWith('*') && p.length > 2) return <em key={k}>{p.slice(1, -1)}</em>;
    const m = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(p);
    if (m) {
      const href = urlSegura(m[2]);
      if (!href) return <React.Fragment key={k}>{m[1]}</React.Fragment>;
      const externo = /^https?:/i.test(href);
      return (
        <a key={k} href={href} {...(externo ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          className="font-semibold text-primary underline decoration-gold decoration-2 underline-offset-4 transition-colors hover:text-gold-deep">{m[1]}</a>
      );
    }
    return <React.Fragment key={k}>{p}</React.Fragment>;
  });
}

type Bloque =
  | { t: 'h2' | 'h3' | 'p' | 'quote'; texto: string }
  | { t: 'ul' | 'ol'; items: string[] }
  | { t: 'img'; alt: string; src: string; pie: string };

function bloques(md: string): Bloque[] {
  return md.replace(/\r\n?/g, '\n').split(/\n{2,}/).map((b) => b.trim()).filter(Boolean).map((b): Bloque => {
    const lineas = b.split('\n');
    if (lineas.length === 1) {
      const img = /^!\[([^\]]*)\]\((\S+?)(?:\s+"([^"]*)")?\)$/.exec(b);
      if (img) return { t: 'img', alt: img[1], src: img[2], pie: img[3] ?? '' };
      if (b.startsWith('### ')) return { t: 'h3', texto: b.slice(4) };
      if (b.startsWith('## ')) return { t: 'h2', texto: b.slice(3) };
    }
    if (lineas.every((l) => /^[-*] /.test(l))) return { t: 'ul', items: lineas.map((l) => l.slice(2)) };
    if (lineas.every((l) => /^\d+\. /.test(l))) return { t: 'ol', items: lineas.map((l) => l.replace(/^\d+\. /, '')) };
    if (lineas.every((l) => l.startsWith('>'))) return { t: 'quote', texto: lineas.map((l) => l.replace(/^>\s?/, '')).join(' ') };
    return { t: 'p', texto: lineas.join(' ') };
  });
}

export default function Prosa({ texto }: { texto: string }) {
  const lista = bloques(texto);
  return (
    <div>
      {lista.map((b, i) => {
        const k = `b${i}`;
        switch (b.t) {
          case 'h2': return <h2 key={k} className="mb-4 mt-12 font-display text-2xl font-bold leading-snug text-primary md:text-[1.75rem]">{enLinea(b.texto, k)}</h2>;
          case 'h3': return <h3 key={k} className="mb-3 mt-9 font-display text-xl font-bold leading-snug text-primary">{enLinea(b.texto, k)}</h3>;
          case 'quote': return (
            <blockquote key={k} className="my-8 rounded-2xl bg-gray-50 px-6 py-5 font-display text-lg italic leading-relaxed text-primary md:px-8 md:text-xl">
              <span aria-hidden="true" className="mr-1 text-3xl font-bold not-italic text-gold">“</span>{enLinea(b.texto, k)}
            </blockquote>
          );
          case 'ul': return <ul key={k} className="mb-6 list-disc space-y-2 pl-6 text-[1.0625rem] leading-8 text-gray-700 marker:text-gold">{b.items.map((it, j) => <li key={j}>{enLinea(it, `${k}-${j}`)}</li>)}</ul>;
          case 'ol': return <ol key={k} className="mb-6 list-decimal space-y-2 pl-6 text-[1.0625rem] leading-8 text-gray-700 marker:font-bold marker:text-primary">{b.items.map((it, j) => <li key={j}>{enLinea(it, `${k}-${j}`)}</li>)}</ol>;
          case 'img': {
            const src = urlSegura(b.src, true);
            if (!src) return null;
            return (
              <figure key={k} className="my-9">
                <img src={src} alt={b.alt} loading="lazy" className="w-full rounded-2xl object-cover" />
                {b.pie && <figcaption className="mt-3 text-center text-sm text-gray-500">{b.pie}</figcaption>}
              </figure>
            );
          }
          default: return <p key={k} className="mb-6 text-[1.0625rem] leading-8 text-gray-700">{enLinea(b.texto, k)}</p>;
        }
      })}
    </div>
  );
}
