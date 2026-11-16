import React from 'react';

/**
 * Íconos de marca de redes sociales (SVG), compartidos por el Footer y la
 * sección de contacto. Usan `currentColor`, así heredan el color del contenedor.
 * Las claves coinciden con las de `redesSociales` en constants/contacto.
 */
export const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden="true">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

export const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5" aria-hidden="true">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

export const YoutubeIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden="true">
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
    <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" className="fill-white" />
  </svg>
);

export const TwitterXIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export const TikTokIcon = () => (
  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1.04-.1z" />
  </svg>
);

/** Mapa clave de red → ícono. */
export const socialIcons: Record<string, React.ReactNode> = {
  facebook: <FacebookIcon />,
  instagram: <InstagramIcon />,
  youtube: <YoutubeIcon />,
  twitter: <TwitterXIcon />,
  tiktok: <TikTokIcon />,
};

/** Mapa clave de red → etiqueta legible (para aria-label / title). */
export const socialLabels: Record<string, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  youtube: 'YouTube',
  twitter: 'X (Twitter)',
  tiktok: 'TikTok',
};

/**
 * Redes que de verdad tienen dirección (https://…). Las vacías o con «#» no se muestran: un ícono que
 * no lleva a ningún lado confunde al visitante.
 */
export function redesActivas(redes: Record<string, string | undefined>): [string, string][] {
  return Object.entries(redes).filter((par): par is [string, string] => typeof par[1] === 'string' && /^https?:\/\/\S+$/i.test(par[1].trim()));
}
