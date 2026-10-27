import React from 'react';
import { motion } from 'framer-motion';
import { Card } from './Card';
import { Badge } from './Badge';

/**
 * Tarjeta informativa genérica: título + badge de tipo + descripción + un dato
 * meta al pie (etiqueta + valor). La usan Convenios ("Vigencia") y Movilidad
 * ("Modalidad"); antes eran dos componentes casi idénticos.
 */
interface InfoCardProps {
  titulo: string;
  tipo: string;
  descripcion: string;
  metaLabel: string;
  metaValor: string;
}

export default function InfoCard({ titulo, tipo, descripcion, metaLabel, metaValor }: InfoCardProps) {
  return (
    <motion.div whileHover={{ scale: 1.02 }} className="h-full">
      <Card className="h-full p-6 flex flex-col">
        <div className="mb-2">
          <h3 className="text-lg font-display font-bold text-primary">{titulo}</h3>
        </div>
        <Badge variant="info" className="w-fit mb-4">{tipo}</Badge>
        <p className="text-gray-600 font-body text-sm mb-4 flex-grow">{descripcion}</p>
        <p className="text-xs font-bold text-gray-600 mt-auto bg-gray-50 p-2 rounded inline-block w-fit">
          {metaLabel}: {metaValor}
        </p>
      </Card>
    </motion.div>
  );
}
