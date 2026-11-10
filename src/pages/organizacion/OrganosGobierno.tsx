import React from 'react';
import { motion } from 'framer-motion';
import { User } from 'lucide-react';
import AnchoredSection from '../../components/layout/AnchoredSection';
import EnConstruccion from '../../components/layout/EnConstruccion';
import { SectionTitle } from '../../components/ui/SectionTitle';
import { Card } from '../../components/ui/Card';
import { decano } from '@profile/content/autoridades';

/**
 * Página agrupada "Órganos de Gobierno". El navbar muestra cada órgano por
 * separado; todos llevan aquí, a su ancla correspondiente: el Decano de la
 * facultad y el Centro Federado (representación estudiantil).
 */
export default function OrganosGobierno() {
  return (
    <>
      <AnchoredSection id="decano">
        <div className="bg-white py-16 md:py-20">
          <div className="container mx-auto px-4 md:px-8">
            <SectionTitle
              title="**Decano**"
              subtitle={decano.facultad}
              center
            />
            <div className="max-w-xl mx-auto mt-10">
              <motion.div whileHover={{ y: -5 }}>
                <Card className="p-8 flex flex-col items-center text-center border-2 border-primary/50 shadow-lg">
                  <div className="w-32 h-32 bg-primary/10 rounded-xl mb-6 flex items-center justify-center text-primary">
                    <User className="w-16 h-16 opacity-70" />
                  </div>
                  <span className="text-primary font-bold text-sm tracking-wider uppercase mb-2">{decano.cargo}</span>
                  <h3 className="text-2xl font-display font-bold text-primary mb-2">{decano.nombre}</h3>
                  <p className="text-gray-600 font-body text-sm">{decano.facultad}</p>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </AnchoredSection>

      <AnchoredSection id="centro-federado">
        <EnConstruccion
          titulo="Centro **Federado**"
          descripcion="Representación estudiantil (Centro Federado) ante los órganos de gobierno."
          bg="bg-gray-50"
        />
      </AnchoredSection>
    </>
  );
}
