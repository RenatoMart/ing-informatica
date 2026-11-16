import React from 'react';
import { redesSociales } from '@profile/content/contacto';
import { socialIcons, socialLabels, redesActivas } from '../icons/social';

export default function RedesSociales() {
  const redes = redesActivas(redesSociales);
  if (redes.length === 0) return null;
  return (
    <div className="flex gap-4 mt-6">
      {redes.map(([red, url]) => (
        <a
          key={red}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition hover:-translate-y-1 shadow-sm hover:shadow-md"
          aria-label={`Síguenos en ${socialLabels[red] ?? red}`}
        >
          {socialIcons[red] ?? <span className="font-bold text-xs uppercase">{red.charAt(0)}</span>}
        </a>
      ))}
    </div>
  );
}
