import { useState } from 'react';
import { Check, Link2, MessageCircle } from 'lucide-react';

/** Botones para compartir una noticia: copiar enlace, WhatsApp y Facebook. */
export default function Compartir({ titulo }: { titulo: string }) {
  const [copiado, setCopiado] = useState(false);
  const url = typeof window === 'undefined' ? '' : window.location.href.split('?')[0];
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2000);
    } catch { /* sin permiso para el portapapeles */ }
  };
  const base = 'inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-primary transition-colors hover:border-primary/40 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold';
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <span className="mr-1 text-sm font-bold text-ink">Compartir</span>
      <button type="button" onClick={copiar} className={base} aria-live="polite">
        {copiado ? <Check className="h-4 w-4 text-success" aria-hidden="true" /> : <Link2 className="h-4 w-4" aria-hidden="true" />}
        {copiado ? 'Enlace copiado' : 'Copiar enlace'}
      </button>
      <a className={base} target="_blank" rel="noopener noreferrer" href={`https://wa.me/?text=${encodeURIComponent(`${titulo} ${url}`)}`}>
        <MessageCircle className="h-4 w-4" aria-hidden="true" /> WhatsApp
      </a>
      <a className={base} target="_blank" rel="noopener noreferrer" href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}>
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true" fill="currentColor"><path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.6-1.5h1.5V4.4c-.3 0-1.2-.1-2.2-.1-2.3 0-3.9 1.4-3.9 4v2.2H8v3h2.5V21h3z" /></svg> Facebook
      </a>
    </div>
  );
}
