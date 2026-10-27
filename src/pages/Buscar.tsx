import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import PageWrapper from '../components/layout/PageWrapper';
import PageHero from '../components/layout/PageHero';
import { siteName } from '@/profile';
import { mensajeDeError } from '../lib/api';
import { useBuscar, useRegistrarVisita } from '../data/ConsultarInformacionController';

const ETIQUETAS: Record<string, string> = { publicacion: 'Noticia', docente: 'Docente', curso: 'Curso', documento: 'Documento' };

export default function Buscar() {
  useRegistrarVisita('busqueda');
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const { data, isLoading, isError, error, isFetching } = useBuscar(q);
  const corto = q.trim().length < 3;

  useEffect(() => {
    document.title = `Buscar | ${siteName}`;
  }, []);

  return (
    <PageWrapper>
      <PageHero title="Buscar en el sitio" subtitle="Noticias, docentes, cursos y documentos." icon={Search} breadcrumbs={[{ label: 'Buscar' }]} />
      <section className="py-12 md:py-16 bg-gray-50 min-h-[50svh]">
        <div className="container mx-auto px-4 md:px-8 max-w-3xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden="true" />
            <input
              type="search"
              value={q}
              onChange={(e) => setParams(e.target.value ? { q: e.target.value } : {}, { replace: true })}
              placeholder="Escribe al menos 3 caracteres..."
              aria-label="Buscar en el sitio"
              className="w-full pl-9 pr-3 py-3 text-base rounded-lg border border-gray-200 bg-white placeholder:text-gray-500 focus:outline-none focus:border-gold transition-colors"
            />
          </div>

          <div className="mt-8" aria-live="polite">
            {corto ? (
              <p className="text-gray-600 text-center">Escribe al menos 3 caracteres para buscar.</p>
            ) : isLoading || isFetching ? (
              <p className="text-gray-500 text-center">Buscando…</p>
            ) : isError ? (
              <p role="alert" className="text-center text-danger">{mensajeDeError(error, 'No se pudo realizar la búsqueda.')}</p>
            ) : data && data.length > 0 ? (
              <ul className="space-y-3">
                {data.map((r, i) => {
                  const externo = /^https?:\/\//.test(r.ruta);
                  const contenido = (
                    <>
                      <span className="text-xs font-bold uppercase tracking-wider text-gold">{ETIQUETAS[r.tipo] ?? r.tipo}</span>
                      <span className="block font-display font-bold text-primary">{r.titulo}</span>
                      {r.extracto && <span className="block text-sm text-gray-600 mt-1">{r.extracto}</span>}
                    </>
                  );
                  const clases = 'block bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-gold/50 transition';
                  return (
                    <li key={`${r.tipo}-${i}`}>
                      {externo ? (
                        <a href={r.ruta} target="_blank" rel="noopener noreferrer" className={clases}>{contenido}</a>
                      ) : (
                        <Link to={r.ruta} className={clases}>{contenido}</Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-gray-600 text-center">No se encontraron resultados para «{q.trim()}».</p>
            )}
          </div>
        </div>
      </section>
    </PageWrapper>
  );
}
