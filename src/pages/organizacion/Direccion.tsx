import React from 'react';
import AnchoredSection from '../../components/layout/AnchoredSection';
import DireccionEscuela from '../autoridades/Direccion';
import DireccionDepartamento from '../autoridades/DireccionDepartamento';

/**
 * Página agrupada "Dirección". El navbar muestra "Director de escuela" y "Director
 * de departamento" por separado; ambos llevan aquí (#escuela / #departamento).
 */
export default function Direccion() {
  return (
    <>
      <AnchoredSection id="escuela">
        <DireccionEscuela />
      </AnchoredSection>
      <AnchoredSection id="departamento">
        <DireccionDepartamento />
      </AnchoredSection>
    </>
  );
}
