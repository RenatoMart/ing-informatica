import React, { useMemo, useState } from 'react';
import { SectionTitle } from '../../components/ui/SectionTitle';
import DocenteCard from '../../components/personas/DocenteCard';
import { useSearchParams } from 'react-router-dom';
import { useDocentes, useDepartamentos, useRegistrarVisita } from '../../data/ConsultarInformacionController';
import { Search } from 'lucide-react';

// Etiqueta del filtro que muestra solo investigadores (un filtro más, como los
// departamentos). Es un valor "virtual" que no corresponde a un departamento real.
const FILTRO_INVESTIGADORES = 'Investigadores';

const PREFIJO_RENACYT = 'renacyt:';

export default function Docentes() {
  useRegistrarVisita('docentes');
  const [params] = useSearchParams();
  const [filtro, setFiltro] = useState('Todos');
  const [query, setQuery] = useState(params.get('q') ?? '');
  const { datos: lista, cargando } = useDocentes();
  const docentes = useMemo(() => lista ?? [], [lista]);
  const deptosDocentes = useMemo(() => [...new Set(docentes.map((d) => d.departamento).filter(Boolean))], [docentes]);
  const { datos: deptosApi } = useDepartamentos(deptosDocentes);

  // Filtros disponibles: "Todos" + departamentos + (si hay) "Investigadores".
  // Se muestran como "Filtro 1", "Filtro 2"... en vez del nombre real: es una
  // plantilla reutilizable por cualquier escuela y no todas tendrán la misma
  // cantidad ni tipo de categorías.
  const filtros = useMemo(() => {
    const departamentos = deptosApi && deptosApi.length > 0 ? deptosApi : deptosDocentes;
    const categorias = [...new Set(docentes.filter((d) => d.investigador && d.categoriaInvestigacion).map((d) => d.categoriaInvestigacion as string))];
    const valores = docentes.some((d) => d.investigador)
      ? [...departamentos, FILTRO_INVESTIGADORES, ...categorias.map((c) => PREFIJO_RENACYT + c)]
      : departamentos;
    return [
      { valor: 'Todos', etiqueta: 'Todos' },
      ...valores.map((valor, i) => ({ valor, etiqueta: `Filtro ${i + 1}` })),
    ];
  }, [docentes, deptosApi, deptosDocentes]);

  const filtrados = useMemo(() => {
    const q = query.trim().toLowerCase();
    return docentes.filter((d) => {
      const okFiltro =
        filtro === 'Todos' ||
        (filtro === FILTRO_INVESTIGADORES
          ? d.investigador
          : filtro.startsWith(PREFIJO_RENACYT)
            ? d.investigador && d.categoriaInvestigacion === filtro.slice(PREFIJO_RENACYT.length)
            : d.departamento === filtro);
      const okQuery = !q || d.nombre.toLowerCase().includes(q) || d.cursoPrincipal.toLowerCase().includes(q);
      return okFiltro && okQuery;
    });
  }, [docentes, filtro, query]);

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

        {cargando && docentes.length === 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 mt-10 max-w-7xl mx-auto" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-[340px] rounded-2xl bg-gray-200 animate-pulse" />)}
          </div>
        ) : filtrados.length > 0 ? (
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
