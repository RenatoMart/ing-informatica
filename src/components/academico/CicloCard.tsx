import React from 'react';
import { Card } from '../ui/Card';

/**
 * Componente para mostrar un ciclo académico
 */
interface CicloCardProps {
  nombre: string;
  semestre: number | string;
  cursos?: string[];
}

export default function CicloCard({ nombre, semestre, cursos }: CicloCardProps) {
  return (
    <Card className="p-6">
      <div className="mb-4">
        <span className="inline-block bg-primary text-white px-3 py-1 rounded-full text-sm font-semibold">
          Ciclo {semestre}
        </span>
        <h3 className="text-xl font-bold mt-2 text-primary">{nombre}</h3>
      </div>
      
      <ul className="space-y-2">
        {cursos?.map((curso, index) => (
          <li key={index} className="flex items-center text-gray-700">
            <span className="w-2 h-2 bg-primary rounded-full mr-3"></span>
            {curso}
          </li>
        ))}
      </ul>
    </Card>
  );
}
