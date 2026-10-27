import React from 'react';

/**
 * Componente para mostrar la malla curricular
 */
interface CicloMalla {
  nombre: string;
  cursos?: string[];
}

export default function MallaCurricular({ ciclos }: { ciclos?: CicloMalla[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {ciclos?.map((ciclo, index) => (
        <div key={index} className="bg-gradient-to-b from-primary-light to-primary rounded-lg p-4 text-white">
          <h3 className="text-lg font-bold mb-3">{ciclo.nombre}</h3>
          <ul className="space-y-2 text-sm">
            {ciclo.cursos?.map((curso, i) => (
              <li key={i} className="flex items-start">
                <span className="mr-2">•</span>
                <span>{curso}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
