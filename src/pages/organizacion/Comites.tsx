import React from 'react';
import AnchoredSection from '../../components/layout/AnchoredSection';
import EnConstruccion from '../../components/layout/EnConstruccion';

/**
 * Página agrupada "Comités". El navbar muestra los comités por separado; todos
 * llevan aquí, a su ancla correspondiente. Las denominaciones son las oficiales;
 * pueden variar por facultad, se priorizan las principales.
 */
const COMITES = [
  { id: 'calidad', titulo: 'Comité de **Calidad**', descripcion: 'Autoevaluación y acreditación de la calidad del programa.' },
  { id: 'curriculo', titulo: 'Comité Técnico de **Currículo**' },
  { id: 'tutoria', titulo: 'Comité de **Tutoría y Consejería**' },
  { id: 'egresado', titulo: 'Comité de **Seguimiento al Egresado**' },
  { id: 'investigacion', titulo: 'Comité de **Investigación**' },
  { id: 'responsabilidad', titulo: 'Comité de **Responsabilidad Social**' },
];

export default function Comites() {
  return (
    <>
      {COMITES.map((comite, idx) => (
        <AnchoredSection key={comite.id} id={comite.id}>
          <EnConstruccion
            titulo={comite.titulo}
            descripcion={comite.descripcion}
            bg={idx % 2 === 1 ? 'bg-gray-50' : 'bg-white'}
          />
        </AnchoredSection>
      ))}
    </>
  );
}
