import React from 'react';
import { LayoutTemplate } from 'lucide-react';
import { SectionTitle } from '../ui/SectionTitle';

/**
 * Bloque de SECCIÓN DE PLANTILLA con el diseño del sitio. Usa el estándar de
 * títulos (SectionTitle, patrón a dos tonos azul+dorado vía `**palabra**`), de
 * modo que la navegación funcione al 100% y solo falte rellenar el contenido.
 *
 * Marca un espacio reservado: la ruta existe y se ve, pero su contenido aún no
 * está modelado. Para convertirlo en página real, reemplaza el <EnConstruccion/>
 * de esa ruta (en src/router) por tu componente de página definitivo.
 */
interface EnConstruccionProps {
  titulo: string;
  descripcion?: string;
  bg?: string;
}

export default function EnConstruccion({ titulo, descripcion, bg = 'bg-white' }: EnConstruccionProps) {
  return (
    <div className={`${bg} py-16 md:py-20`}>
      <div className="container mx-auto px-4 md:px-8 flex flex-col items-center text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gold/15 border border-gold/25 mb-6">
          <LayoutTemplate className="w-8 h-8 text-gold" />
        </div>
        <SectionTitle
          title={titulo}
          subtitle={descripcion || 'Espacio reservado para esta sección. Aquí va el contenido de tu programa.'}
          center
        />
      </div>
    </div>
  );
}
