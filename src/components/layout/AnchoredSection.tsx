import React from 'react';

/**
 * Envoltorio de subsección con ancla. Da un id navegable (#) y reserva el espacio
 * superior (scroll-margin-top) para que al saltar con el hash el encabezado no
 * quede tapado por la cabecera + barra de pestañas sticky.
 *
 * Lo usan las páginas AGRUPADAS (ej. Misión y Visión, Objetivos, Comités), donde
 * varias etiquetas del navbar (#mision, #vision...) caen en la misma página.
 */
interface AnchoredSectionProps {
  id: string;
  className?: string;
  children: React.ReactNode;
}

export default function AnchoredSection({ id, className = '', children }: AnchoredSectionProps) {
  return (
    <section id={id} className={`scroll-mt-[180px] ${className}`}>
      {children}
    </section>
  );
}
