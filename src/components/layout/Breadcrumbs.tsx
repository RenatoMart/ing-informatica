import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { NAV_LINKS, flattenItems } from '@/navigation';

// Nombre "extendido" de cada sección para la miga de pan (puede diferir del label
// corto del menú, p. ej. "Nosotros" → "Sobre Nosotros").
const sectionLabels: Record<string, string> = {
  '/nosotros': 'Sobre Nosotros',
  '/organizacion': 'Organización',
  '/academico': 'Académico',
  '/investigacion': 'Investigación',
  '/contacto': 'Contacto',
};

export default function Breadcrumbs() {
  const { pathname } = useLocation();

  if (pathname === '/') return null;

  const basePath = `/${pathname.split('/')[1]}`;
  const section = NAV_LINKS.find((link) => link.path === basePath);
  const subsection = flattenItems(section?.groups).find((sub) => sub.path === pathname);

  const sectionName =
    sectionLabels[basePath] ||
    section?.name ||
    (basePath.length > 1 ? basePath.charAt(1).toUpperCase() + basePath.slice(2) : '');

  return (
    <div className="bg-primary py-3 w-full">
      <div className="container mx-auto px-4 md:px-8">
        <nav className="flex text-[13px] md:text-sm text-white/80 font-body" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-2">
            <li className="inline-flex items-center">
              <Link to="/" className="inline-flex items-center hover:text-white transition-colors">
                Inicio
              </Link>
            </li>

            <li>
              <div className="flex items-center">
                <ChevronRight className="w-4 h-4 text-white/60 mx-1" />
                <Link
                  to={basePath}
                  className={`hover:text-white transition-colors ${!subsection ? 'text-white font-semibold' : ''}`}
                >
                  {sectionName}
                </Link>
              </div>
            </li>

            {subsection && (
              <li>
                <div className="flex items-center">
                  <ChevronRight className="w-4 h-4 text-white/60 mx-1" />
                  <span className="text-white font-semibold">{subsection.name}</span>
                </div>
              </li>
            )}
          </ol>
        </nav>
      </div>
    </div>
  );
}
