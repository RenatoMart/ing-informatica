import React, { useState } from 'react';
import AnchoredSection from '../../components/layout/AnchoredSection';
import PerfilIngresante from '../academico/PerfilIngresante';
import PerfilEgresado from '../academico/PerfilEgresado';
import CurriculumVersionSwitch from '../../components/academico/CurriculumVersionSwitch';
import EnConstruccion from '../../components/layout/EnConstruccion';

/**
 * Página agrupada "Perfiles". El navbar muestra "Perfil de ingreso" y "Perfil de
 * egreso" por separado; ambos llevan aquí (#ingreso / #egreso). Reutiliza el
 * contenido existente de cada perfil.
 */
export default function Perfiles() {
  const [version, setVersion] = useState('2027');

  return (
    <>
      {/* Selector de versión del plan curricular (2018 / 2027) */}
      <div className="bg-white pt-10">
        <div className="container mx-auto px-4 md:px-8">
          <CurriculumVersionSwitch value={version} onChange={setVersion} />
        </div>
      </div>

      {version === '2018' ? (
        <>
          <AnchoredSection id="ingreso">
            <PerfilIngresante />
          </AnchoredSection>
          <AnchoredSection id="egreso">
            <PerfilEgresado />
          </AnchoredSection>
        </>
      ) : (
        <EnConstruccion titulo="Perfiles **2027**" descripcion="Los perfiles del plan 2027 estarán disponibles próximamente." />
      )}
    </>
  );
}
