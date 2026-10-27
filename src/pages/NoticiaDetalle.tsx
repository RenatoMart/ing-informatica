import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Newspaper } from 'lucide-react';
import PageWrapper from '../components/layout/PageWrapper';
import PageHero from '../components/layout/PageHero';
import { siteName } from '@/profile';
import { aNoticia, usePublicacion, useRegistrarVisita } from '../data/ConsultarInformacionController';

export default function NoticiaDetalle() {
  const { id } = useParams();
  useRegistrarVisita('noticias');
  const { data, isLoading, isError } = usePublicacion(id);

  useEffect(() => {
    document.title = `${data?.titulo ?? 'Noticia'} | ${siteName}`;
  }, [data]);

  const n = data ? aNoticia(data) : null;
  const imagenes = (data?.imagenes ?? [])
    .map((i) => (typeof i === 'string' ? i : i.url ?? i.imagen_url ?? ''))
    .filter(Boolean);

  return (
    <PageWrapper>
      <PageHero
        title={n?.titulo ?? 'Noticia'}
        icon={Newspaper}
        breadcrumbs={[{ label: 'Noticias', to: '/noticias' }, { label: n?.titulo ?? 'Detalle' }]}
      />
      <section className="py-12 md:py-16 bg-gray-50 min-h-[50svh]">
        <div className="container mx-auto px-4 md:px-8 max-w-3xl">
          {isLoading ? (
            <div className="space-y-3" aria-hidden="true">
              <div className="h-64 rounded-xl bg-gray-200 animate-pulse" />
              <div className="h-4 rounded bg-gray-200 animate-pulse" />
              <div className="h-4 w-2/3 rounded bg-gray-200 animate-pulse" />
            </div>
          ) : isError || !n ? (
            <div className="text-center py-10">
              <h2 className="font-display font-bold text-primary text-xl mb-2">No encontramos esta noticia</h2>
              <p className="text-gray-600 mb-6">Puede haber sido retirada o el enlace no es correcto.</p>
              <Link to="/noticias" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-gold transition-colors">
                <ArrowLeft className="w-4 h-4" /> Ver todas las noticias
              </Link>
            </div>
          ) : (
            <article className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {n.imagen && <img src={n.imagen} alt={n.titulo} className="w-full max-h-96 object-cover" />}
              <div className="p-6 md:p-10">
                <div className="flex items-center gap-2 mb-4">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${n.categoriaColor}`}>{n.categoria}</span>
                  <span className="flex items-center gap-1 text-gray-500 text-xs ml-auto">
                    <Calendar className="w-3 h-3" /> {n.fechaFormateada}
                  </span>
                </div>
                {n.resumen && <p className="text-gray-700 font-semibold mb-4">{n.resumen}</p>}
                <div className="text-gray-700 leading-relaxed space-y-4">
                  {(data?.contenido ?? '').split(/\n{2,}/).filter(Boolean).map((p, i) => (
                    <p key={i} className="whitespace-pre-line">{p}</p>
                  ))}
                </div>
                {imagenes.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 mt-8">
                    {imagenes.map((src, i) => (
                      <img key={i} src={src} alt="" loading="lazy" className="w-full h-40 object-cover rounded-lg" />
                    ))}
                  </div>
                )}
                <Link to="/noticias" className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-gold transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Volver a noticias
                </Link>
              </div>
            </article>
          )}
        </div>
      </section>
    </PageWrapper>
  );
}
