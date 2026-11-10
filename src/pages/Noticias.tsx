import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageWrapper from '../components/layout/PageWrapper';
import PageHero from '../components/layout/PageHero';
import { Card } from '../components/ui/Card';
import { noticias } from '@profile/content/noticias';
import { site } from '@/profile';
import { Newspaper, Calendar, ArrowRight } from 'lucide-react';

/** Enlace interno (la página de la noticia) o externo (si el panel puso un enlace propio). */
function Enlace({ to, className, children }: { to: string; className?: string; children: React.ReactNode }) {
  return /^https?:\/\//i.test(to)
    ? <a href={to} target="_blank" rel="noopener noreferrer" className={className}>{children}</a>
    : <Link to={to} className={className}>{children}</Link>;
}

export default function Noticias() {
  const [destacada, ...resto] = noticias;
  return (
    <PageWrapper>
      <PageHero
        title="Noticias y Actualidad"
        subtitle={`Eventos, convocatorias y logros de la ${site.programa.nombre}.`}
        icon={Newspaper}
        breadcrumbs={[{ label: 'Noticias' }]}
      />

      <section className="py-16 md:py-20 bg-gray-50">
        <div className="container mx-auto px-4 md:px-8">
          {noticias.length === 0 && <p className="py-10 text-center text-gray-600">Aún no hay noticias publicadas.</p>}

          {destacada && (
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-10">
              <Enlace to={destacada.link} className="group grid overflow-hidden rounded-2xl border border-gray-200 bg-white transition-shadow hover:shadow-lg md:grid-cols-2">
                {destacada.imagen && (
                  <div className="aspect-[16/10] overflow-hidden md:aspect-auto md:min-h-[20rem]">
                    <img src={destacada.imagen} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                )}
                <div className="flex flex-col justify-center p-7 md:p-10">
                  <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                    {destacada.categoria && <span className={`rounded-full px-3 py-1 text-xs font-bold ${destacada.categoriaColor}`}>{destacada.categoria}</span>}
                    <span className="inline-flex items-center gap-1.5"><Calendar className="h-4 w-4" aria-hidden="true" />{destacada.fechaFormateada}</span>
                  </div>
                  <h2 className="font-display text-2xl font-bold leading-snug text-primary transition-colors group-hover:text-gold-deep md:text-3xl">{destacada.titulo}</h2>
                  <p className="mt-4 leading-relaxed text-gray-600">{destacada.resumen}</p>
                  <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-primary transition-[gap] group-hover:gap-3">Leer la noticia <ArrowRight className="h-4 w-4" aria-hidden="true" /></span>
                </div>
              </Enlace>
            </motion.div>
          )}

          <div className="grid grid-cols-1 gap-7 md:grid-cols-3">
            {resto.map((noticia, idx) => (
              <motion.div
                key={noticia.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08 }}
                whileHover={{ y: -4 }}
              >
                <Enlace to={noticia.link} className="block h-full group">
                  <Card className="h-full flex flex-col p-0 overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="h-1.5 bg-primary w-full" />
                    {noticia.imagen && (
                      <div className="h-48 w-full overflow-hidden shrink-0">
                        <img src={noticia.imagen} alt="" loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                    )}
                    <div className="p-6 flex flex-col flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        {noticia.categoria && <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${noticia.categoriaColor}`}>{noticia.categoria}</span>}
                        <span className="flex items-center gap-1 text-gray-500 text-xs ml-auto"><Calendar className="w-3 h-3" aria-hidden="true" />{noticia.fechaFormateada}</span>
                      </div>
                      <h3 className="font-display font-bold text-primary text-base leading-snug mb-3 group-hover:text-gold-deep transition-colors flex-1">{noticia.titulo}</h3>
                      <p className="text-gray-600 text-sm leading-relaxed mb-4">{noticia.resumen}</p>
                      <span className="mt-auto inline-flex items-center gap-1 text-primary text-sm font-bold group-hover:gap-2 transition-[gap]">Leer más <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" /></span>
                    </div>
                  </Card>
                </Enlace>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </PageWrapper>
  );
}
