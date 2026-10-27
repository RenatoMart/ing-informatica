import React from 'react';
import AnchoredSection from '../../components/layout/AnchoredSection';
import EnConstruccion from '../../components/layout/EnConstruccion';
import Proyectos from './Proyectos';

/**
 * Página agrupada "Proyectos". El navbar muestra "Proyectos de investigación" y
 * "Proyectos y tesis" por separado; ambos llevan aquí (#investigacion / #tesis).
 */
export default function ProyectosGrupo() {
  return (
    <>
      <AnchoredSection id="investigacion">
        <Proyectos />
      </AnchoredSection>
      <AnchoredSection id="tesis">
        <EnConstruccion titulo="Proyectos y **tesis**" bg="bg-gray-50" />
      </AnchoredSection>
    </>
  );
}
