import React from 'react';
import { SectionTitle } from '../../components/ui/SectionTitle';
import MisionCard from '../../components/identidad/MisionCard';
import ValorItem from '../../components/identidad/ValorItem';
import { mision, vision, valores, misionUnt, visionUnt } from '@profile/content/identidad';
import { Target, Telescope } from 'lucide-react';

export default function MisionVision() {
  return (
    <>
      {/* ── Misión & Visión ── */}
      <div className="bg-gray-50 py-16 md:py-20">
        <div className="container mx-auto px-4 md:px-8">
          <SectionTitle
            title="Misión y **Visión**"
            subtitle="Los propósitos que guían nuestro camino hacia la excelencia y la sostenibilidad."
            center
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12 max-w-6xl mx-auto">
            <div id="mision" className="scroll-mt-[180px]">
              <MisionCard
                title="Nuestra Misión"
                description={mision}
                icon={<Target className="w-8 h-8 text-gold" />}
              />
            </div>
            <div id="vision" className="scroll-mt-[180px]">
              <MisionCard
                title="Nuestra Visión"
                description={vision}
                icon={<Telescope className="w-8 h-8 text-gold" />}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Misión y visión de la UNT ── */}
      <div className="bg-white py-16 md:py-20">
        <div className="container mx-auto px-4 md:px-8">
          <SectionTitle
            title="Universidad Nacional de **Trujillo**"
            subtitle="Misión y visión institucionales en las que se enmarca nuestro programa."
            center
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12 max-w-6xl mx-auto">
            <MisionCard title="Misión de la UNT" description={misionUnt} icon={<Target className="w-8 h-8 text-gold" />} />
            <MisionCard title="Visión de la UNT" description={visionUnt} icon={<Telescope className="w-8 h-8 text-gold" />} />
          </div>
        </div>
      </div>

      {/* ── Valores ── */}
      <div className="bg-gray-50 py-16 md:py-20">
        <div className="container mx-auto px-4 md:px-8">
          <SectionTitle
            title="Nuestros **Valores**"
            subtitle="Principios que guían a nuestra comunidad universitaria."
            center
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-12 max-w-6xl mx-auto">
            {valores.map((valor, idx) => (
              <ValorItem key={idx} valor={valor} index={idx} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}