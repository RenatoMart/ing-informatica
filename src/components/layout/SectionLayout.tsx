import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import PageWrapper from './PageWrapper';
import PageHero, { type Breadcrumb } from './PageHero';
import SectionTabs from './SectionTabs';
import { getSection, getInternalItems } from '@/navigation';
import { siteName as SITE_NAME } from '@/profile';

interface SectionLayoutProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  basePath: string;
  breadcrumbs?: Breadcrumb[];
}

/**
 * Layout COMPARTIDO de una sección: cabecera (banner) + barra de pestañas, ambos
 * idénticos en todas las subpáginas y sin duplicar código. El contenido de cada
 * subsección se inyecta vía <Outlet/> (rutas anidadas). Mantiene el diseño actual:
 * mismo PageWrapper, mismo PageHero, mismos estilos.
 */
export default function SectionLayout({ title, subtitle, icon, basePath, breadcrumbs }: SectionLayoutProps) {
  const { pathname } = useLocation();
  const section = getSection(basePath);
  const links = getInternalItems(section);

  // Título de documento propio por subsección (indexable, enlazable). En la raíz
  // de la sección refleja la primera subsección (la que se muestra por defecto).
  useEffect(() => {
    const active = links.find((link) => link.path === pathname) ?? links[0];
    document.title = active
      ? `${active.name} | ${title} | ${SITE_NAME}`
      : `${title} | ${SITE_NAME}`;
  }, [pathname, links, title]);

  return (
    <PageWrapper>
      <div className="flex flex-col">
        <PageHero title={title} subtitle={subtitle} icon={icon} breadcrumbs={breadcrumbs} />
        {links.length > 0 && <SectionTabs links={links} />}
        <Outlet />
      </div>
    </PageWrapper>
  );
}
