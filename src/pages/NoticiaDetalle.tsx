import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Calendar, Clock } from 'lucide-react';
import PageWrapper from '../components/layout/PageWrapper';
import Prosa from '../components/noticias/Prosa';
import Compartir from '../components/noticias/Compartir';
import { noticias } from '@profile/content/noticias';
import { siteName } from '@/profile';

const minutosDeLectura = (t: string) => Math.max(1, Math.round(t.trim().split(/\s+/).filter(Boolean).length / 200));

export default function NoticiaDetalle() {
  const { id } = useParams();
  const n = noticias.find((x) => String(x.id) === id);
  useEffect(() => {
    if (n) document.title = `${n.titulo} · ${siteName}`;
  }, [n]);

  if (!n) {
    return (
      <PageWrapper>
        <div className="container mx-auto flex min-h-[50vh] flex-col items-center justify-center px-4 py-16 text-center">
          <h1 className="font-display text-3xl font-bold text-primary">No encontramos esta noticia</h1>
          <p className="mt-3 max-w-md text-gray-600">Puede que haya sido retirada o que la dirección esté mal escrita.</p>
          <Link to="/noticias" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-white transition-colors hover:bg-primary/90"><ArrowLeft className="h-4 w-4" /> Ver todas las noticias</Link>
        </div>
      </PageWrapper>
    );
  }

  const otras = noticias.filter((x) => x.id !== n.id).slice(0, 3);
  const cuerpo = (n as { contenido?: string }).contenido?.trim() ?? '';
  return (
    <PageWrapper>
      <article className="bg-white">
        <div className={`container mx-auto grid gap-12 px-4 py-10 md:px-8 md:py-14 ${otras.length > 0 ? 'max-w-6xl lg:grid-cols-[minmax(0,1fr)_21rem]' : 'max-w-3xl'}`}>
          <div className="min-w-0">
            <Link to="/noticias" className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Todas las noticias</Link>

            <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600">
              {n.categoria && <span className={`rounded-full px-3 py-1 text-xs font-bold ${n.categoriaColor}`}>{n.categoria}</span>}
              <span className="inline-flex items-center gap-1.5"><Calendar className="h-4 w-4" aria-hidden="true" /> <time dateTime={n.fecha}>{n.fechaFormateada}</time></span>
              {cuerpo && <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4" aria-hidden="true" /> {minutosDeLectura(cuerpo)} min de lectura</span>}
            </div>

            <h1 className="font-display text-3xl font-bold leading-tight text-primary md:text-[2.5rem]">{n.titulo}</h1>
            {n.resumen && <p className="mt-5 text-lg leading-relaxed text-gray-700 md:text-xl">{n.resumen}</p>}
            <div className="my-8 h-1 w-16 rounded bg-gold" aria-hidden="true" />

            {n.imagen && (
              <figure className="mb-10">
                <img src={n.imagen} alt="" className="aspect-[16/9] w-full rounded-2xl object-cover" />
              </figure>
            )}

            {cuerpo ? <Prosa texto={cuerpo} /> : <p className="text-gray-600">Esta noticia aún no tiene contenido.</p>}

            <div className="mt-12 border-t border-gray-200 pt-6"><Compartir titulo={n.titulo} /></div>
          </div>

          {otras.length > 0 && (
            <aside aria-labelledby="mas-noticias" className="lg:pt-12">
              <h2 id="mas-noticias" className="mb-5 font-display text-xl font-bold text-primary">Más noticias</h2>
              <div className="space-y-5">
                {otras.map((o) => (
                  <Link key={o.id} to={`/noticias/${o.id}`} className="group flex gap-4">
                    {o.imagen && <img src={o.imagen} alt="" loading="lazy" className="h-20 w-24 shrink-0 rounded-xl object-cover" />}
                    <span className="min-w-0">
                      <span className="block text-xs text-gray-500">{o.fechaFormateada}</span>
                      <span className="line-clamp-3 block font-display text-[0.95rem] font-bold leading-snug text-primary transition-colors group-hover:text-gold-deep">{o.titulo}</span>
                    </span>
                  </Link>
                ))}
              </div>
              <Link to="/noticias" className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline">Ver todas <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
            </aside>
          )}
        </div>
      </article>
    </PageWrapper>
  );
}
