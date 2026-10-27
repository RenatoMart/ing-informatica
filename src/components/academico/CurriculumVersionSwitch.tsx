import React from 'react';
import { CalendarDays } from 'lucide-react';

/**
 * Selector de versión de plan curricular (p. ej. 2018 / 2027). Switch segmentado
 * (2018 | 2027) reutilizable: se usa arriba de la malla, los objetivos y los
 * perfiles para cambiar entre versiones del plan de estudios.
 *
 * Es presentacional (controlado): el estado vive en la página que lo usa.
 */
interface CurriculumVersionSwitchProps {
  value: string;
  onChange: (version: string) => void;
  versions?: string[];
  className?: string;
}

export default function CurriculumVersionSwitch({
  value,
  onChange,
  versions = ['2018', '2027'],
  className = '',
}: CurriculumVersionSwitchProps) {
  return (
    <div
      className={`flex flex-wrap items-center gap-3 ${className}`}
      role="group"
      aria-label="Seleccionar versión del plan curricular"
    >
      <CalendarDays className="w-5 h-5 text-gold" aria-hidden="true" />

      {/* Switch segmentado tipo cápsula: la opción activa llena por completo su mitad */}
      <div className="inline-flex items-stretch rounded-full border-2 border-primary bg-white overflow-hidden shadow-sm">
        {versions.map((version) => {
          const active = value === version;
          return (
            <button
              key={version}
              type="button"
              onClick={() => onChange(version)}
              aria-pressed={active}
              className={`px-7 py-2.5 text-sm font-black transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-inset ${
                active
                  ? 'bg-primary text-gold'
                  : 'bg-transparent text-primary hover:bg-primary/5'
              }`}
            >
              {version}
            </button>
          );
        })}
      </div>
    </div>
  );
}
