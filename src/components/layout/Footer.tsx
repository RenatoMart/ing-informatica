import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Clock, ExternalLink, BookOpen } from 'lucide-react';
import { informacionContacto, redesSociales } from '@profile/content/contacto';
import { socialIcons, socialLabels } from '../icons/social';
import { site, branding } from '@/profile';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-primary text-white">
      {/* Main footer body */}
      <div className="pt-14 pb-10">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12 mb-12">

            {/* Columna 1: Identidad + Redes */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <img src={branding.logos.universidad} alt={branding.alt.universidad} loading="lazy" className="h-14 w-auto object-contain brightness-0 invert" />
                <div className="flex flex-col">
                  <span className="font-display font-bold leading-tight text-base text-white">
                    {site.programa.nombreCorto}
                  </span>
                  <span className="text-white/60 text-xs uppercase tracking-wider">
                    {site.universidad.siglas}{site.facultad ? ` · ${site.facultad}` : ''}
                  </span>
                </div>
              </div>
              <p className="text-gray-300 font-body text-sm leading-relaxed mb-6">
                {site.tagline}
              </p>
              {/* Social icons */}
              <div className="flex items-center gap-3 flex-wrap">
                {Object.entries(redesSociales).map(([red, url]) => (
                  <a
                    key={red}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={socialLabels[red] || red}
                    className="w-11 h-11 rounded-full bg-white/10 hover:bg-gold flex items-center justify-center transition-colors duration-200"
                    aria-label={`Visitar ${socialLabels[red] || red}`}
                  >
                    {socialIcons[red] || <span className="text-xs font-bold uppercase">{red.charAt(0)}</span>}
                  </a>
                ))}
              </div>
            </div>

            {/* Columna 2: Enlaces Rápidos */}
            <div>
              <h3 className="font-display font-bold text-base mb-5 text-gold uppercase tracking-wider">
                Información
              </h3>
              <ul className="space-y-2.5">
                {[
                  { label: 'Misión y Visión', to: '/nosotros/mision-vision' },
                  { label: 'Historia del Programa', to: '/nosotros/historia' },
                  { label: 'Plan de Estudios', to: '/academico/malla-curricular' },
                  { label: 'Perfil del Egresado', to: '/academico/perfiles#egreso' },
                  { label: 'Líneas de Investigación', to: '/investigacion/lineas' },
                  { label: 'Plana Docente', to: '/organizacion/docentes' },
                ].map(({ label, to }) => (
                  <li key={to}>
                    <Link
                      to={to}
                      className="text-gray-300 hover:text-white hover:translate-x-1 transition duration-150 text-sm flex items-center gap-1.5"
                    >
                      <span className="text-gold text-xs">›</span>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Columna 3: Contacto */}
            <div>
              <h3 className="font-display font-bold text-base mb-5 text-gold uppercase tracking-wider">
                Contacto
              </h3>
              <ul className="space-y-4">
                <li className="flex gap-3 text-gray-300 text-sm items-start">
                  <MapPin className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                  <span>{informacionContacto.direccion}</span>
                </li>
                <li className="flex gap-3 text-gray-300 text-sm items-center">
                  <Phone className="w-4 h-4 text-gold shrink-0" />
                  <span>{informacionContacto.telefonos.join(' / ')}</span>
                </li>
                <li className="flex gap-3 text-sm items-center">
                  <Mail className="w-4 h-4 text-gold shrink-0" />
                  <a href={`mailto:${informacionContacto.correo}`} className="text-gray-300 hover:text-white transition-colors">
                    {informacionContacto.correo}
                  </a>
                </li>
              </ul>
            </div>

            {/* Columna 4: Horarios + Links institucionales */}
            <div>
              <h3 className="font-display font-bold text-base mb-5 text-gold uppercase tracking-wider">
                Horarios de Atención
              </h3>
              <div className="flex gap-3 text-gray-300 text-sm items-start mb-6">
                <Clock className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-white font-semibold">Lunes a Viernes</p>
                  <p>08:00 – 13:00 hrs</p>
                  <p>14:00 – 16:00 hrs</p>
                </div>
              </div>
              <div className="space-y-2 border-t border-white/10 pt-5">
                <p className="text-gray-300 text-xs uppercase tracking-wider mb-3 font-semibold">
                  Portal Institucional
                </p>
                {site.enlacesInstitucionales.map(({ label, url }) => (
                  <a
                    key={label}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-gray-300 hover:text-white text-sm transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    {label}
                  </a>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="bg-black/20 py-4">
        <div className="container mx-auto px-4 md:px-8 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-gray-300">
          <p>© {currentYear} {site.programa.nombre} · {site.universidad.siglas}. Todos los derechos reservados.</p>
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-5">
            <p>Ley de Transparencia N° 27806: Acceso a la Información Pública</p>
            <a
              href={site.enlaces.libroReclamaciones}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-white/30 rounded-md px-3 py-1.5 font-semibold text-white hover:bg-white/10 transition-colors shrink-0"
            >
              <BookOpen className="w-4 h-4 text-gold" />
              Libro de Reclamaciones
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}