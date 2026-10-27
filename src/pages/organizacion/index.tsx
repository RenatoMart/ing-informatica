import React from 'react';
import SectionLayout from '../../components/layout/SectionLayout';
import { site } from '@/profile';
import { Building2 } from 'lucide-react';

export default function OrganizacionIndex() {
  return (
    <SectionLayout
      title="Organización"
      subtitle={`Autoridades, personal y comités que dirigen y aseguran la calidad del ${site.denominacion}.`}
      icon={Building2}
      basePath="/organizacion"
      breadcrumbs={[{ label: 'Organización' }]}
    />
  );
}
