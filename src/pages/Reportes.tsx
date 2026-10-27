import React from 'react';
import PageWrapper from '../components/layout/PageWrapper';
import PageHero from '../components/layout/PageHero';
import EnConstruccion from '../components/layout/EnConstruccion';
import { BarChart3 } from 'lucide-react';

export default function Reportes() {
  return (
    <PageWrapper>
      <PageHero
        title="Reportes"
        subtitle="Información y estadísticas del programa de estudios."
        icon={BarChart3}
        breadcrumbs={[{ label: 'Reportes' }]}
      />
      <EnConstruccion
        titulo="**Reportes**"
        descripcion="Sección en preparación. Aquí se publicarán los reportes del programa."
      />
    </PageWrapper>
  );
}
