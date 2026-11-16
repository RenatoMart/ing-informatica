import React from 'react';
import { redesSociales } from '@profile/content/contacto';
import { socialIcons, socialLabels, redesActivas } from '../icons/social';

// Colores de marca de cada red para el botón flotante.
const FONDO: Record<string, string> = {
  facebook: 'bg-[#1877F2]',
  tiktok: 'bg-black',
  instagram: 'bg-[#C13584]',
  youtube: 'bg-[#FF0000]',
  twitter: 'bg-black',
};

/**
 * Accesos flotantes a las redes de la escuela (las dos primeras que tengan dirección en el panel).
 * Quedan por debajo del menú móvil y de sus fondos (z-30) para no tapar nada.
 */
export default function FloatingSocials() {
  const redes = redesActivas(redesSociales).slice(0, 2);
  if (redes.length === 0) return null;
  return (
    <div className="fixed bottom-6 right-6 z-30 flex flex-col gap-3">
      {redes.map(([red, url]) => (
        <a
          key={red}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${socialLabels[red] ?? red} de la escuela (abre en pestaña nueva)`}
          title={socialLabels[red] ?? red}
          className={`w-12 h-12 ${FONDO[red] ?? 'bg-primary'} text-white rounded-full flex items-center justify-center shadow-lg transition duration-300 hover:scale-110 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2`}
        >
          {socialIcons[red] ?? <span className="text-xs font-bold uppercase">{red.charAt(0)}</span>}
        </a>
      ))}
    </div>
  );
}
