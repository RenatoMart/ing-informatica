import React from 'react';
import { redesSociales } from '@profile/content/contacto';
import { socialIcons, socialLabels } from '../icons/social';

export default function RedesSociales() {
  return (
    <div className="flex gap-4 mt-6">
      {Object.entries(redesSociales).map(([red, url]) => (
        <a
          key={red}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition hover:-translate-y-1 shadow-sm hover:shadow-md"
          aria-label={`Síguenos en ${socialLabels[red] ?? red}`}
        >
          {socialIcons[red] ?? <span className="font-bold text-xs uppercase">{red.charAt(0)}</span>}
        </a>
      ))}
    </div>
  );
}
