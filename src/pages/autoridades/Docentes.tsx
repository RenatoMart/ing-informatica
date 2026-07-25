import React, { useMemo, useState } from 'react';
import { SectionTitle } from '../../components/ui/SectionTitle';
import DocenteCard from '../../components/personas/DocenteCard';
import { docentes } from '@profile/content/docentes';
import { Search } from 'lucide-react';

// Etiqueta del filtro que muestra solo investigadores (un filtro más, como los
// departamentos). Es un valor "virtual" que no corresponde a un departamento real.
const FILTRO_INVESTIGADORES = 'Investigadores';

export default function Docentes() {
  const [filtro, setFiltro] = useState('Todos');
  const [query, setQuery] = useState('');

  // Filtros disponibles: "Todos" + departamentos + (si hay) "Investigadores".
  // Se muestran como "Filtro 1", "Filtro 2"... en vez del nombre real: es una
  // plantilla reutilizable por cualquier escuela y no todas tendrán la misma
  // cantidad ni tipo de categorías.
  const filtros = useMemo(() => {
    const departamentos = [...new Set(docentes.map((d) => d.departamento).filter(Boolean))];
    const valores = docentes.some((d) => d.investigador)
      ? [...departamentos, FILTRO_INVESTIGADORES]
      : departamentos;
    return [
      { valor: 'Todos', etiqueta: 'Todos' },
      ...valores.map((valor, i) => ({ valor, etiqueta: `Filtro ${i + 1}` })),
    ];
  }, []);

  const filtrados = useMemo(() => {
    const q = query.trim().toLowerCase();
    return docentes.filter((d) => {
      const okFiltro =
        filtro === 'Todos' ||
        (filtro === FILTRO_INVESTIGADORES ? d.investigador : d.departamento === filtro);
      const okQuery = !q || d.nombre.toLowerCase().includes(q) || d.cursoPrincipal.toLowerCase().includes(q);
      return okFiltro && okQuery;
    });
  }, [filtro, query]);

  return (
    <div className="bg-gray-50 py-16 md:py-20">
      <div className="container mx-auto px-4 md:px-8">
        <SectionTitle
          title="Plana **Docente**"
          subtitle="Profesores, investigadores y especialistas comprometidos con tu formación de calidad."
          center
        />

        {/* Filtros: departamento + búsqueda */}
        <div className="mt-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 max-w-7xl mx-auto">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar docentes">
            {filtros.map((f) => (
              <button
                key={f.valor}
                type="button"
                onClick={() => setFiltro(f.valor)}
                aria-pressed={filtro === f.valor}
                className={`px-4 py-2.5 rounded-full text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 ${
                  filtro === f.valor
                    ? 'bg-primary text-white'
                    : 'bg-white text-primary border border-gray-200 hover:border-gold/50'
                }`}
              >
                {f.etiqueta}
              </button>
            ))}
          </div>

          <div className="relative w-full lg:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden="true" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre o curso..."
              aria-label="Buscar docente"
              className="w-full pl-9 pr-3 py-2.5 text-base rounded-lg border border-gray-200 bg-white placeholder:text-gray-500 focus:outline-none focus:border-gold transition-colors"
            />
          </div>
        </div>

        {filtrados.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 mt-10 max-w-7xl mx-auto">
            {filtrados.map((docente, idx) => (
              <DocenteCard key={`${docente.nombre}-${idx}`} docente={docente} />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-600 mt-12">
            No se encontraron docentes con esos criterios. Prueba con otro departamento o búsqueda.
          </p>
        )}
      </div>
    </div>
  );
}
