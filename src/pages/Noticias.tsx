import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageWrapper from '../components/layout/PageWrapper';
import PageHero from '../components/layout/PageHero';
import { Card } from '../components/ui/Card';
import { useNoticias, useRegistrarVisita } from '../data/ConsultarInformacionController';
import { site } from '@/profile';
import { Newspaper, Calendar, ArrowRight } from 'lucide-react';

export default function Noticias() {
  useRegistrarVisita('noticias');
  const { noticias = [], cargando, hayMas, cargandoMas, cargarMas } = useNoticias(9);
  return (
    <PageWrapper>
      <PageHero
        title="Noticias y Actualidad"
        subtitle={`Eventos, convocatorias y logros del ${site.programa.nombre}.`}
        icon={Newspaper}
        breadcrumbs={[{ label: 'Noticias' }]}
      />

      <section className="py-16 md:py-20 bg-gray-50">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
            {cargando && noticias.length === 0
              ? [0, 1, 2].map((i) => <div key={i} className="h-[26rem] rounded-xl bg-gray-200 animate-pulse" aria-hidden="true" />)
              : noticias.map((noticia, idx) => (
              <motion.div
                key={noticia.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (idx % 9) * 0.1 }}
                whileHover={{ y: -4 }}
              >
                <Link to={noticia.link} className="block h-full group">
                  <Card className="h-full flex flex-col p-0 overflow-hidden hover:shadow-lg transition-shadow">
                    {/* Franja superior */}
                    <div className="h-1.5 bg-primary w-full" />
                    {/* Imagen */}
                    <div className="h-48 w-full overflow-hidden shrink-0">
                      <img
                        src={noticia.imagen}
                        alt={noticia.titulo}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-6 flex flex-col flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${noticia.categoriaColor}`}>
                          {noticia.categoria}
                        </span>
                        <span className="flex items-center gap-1 text-gray-500 text-xs ml-auto">
                          <Calendar className="w-3 h-3" />
                          {noticia.fechaFormateada}
                        </span>
                      </div>
                      <h3 className="font-display font-bold text-primary text-base leading-snug mb-3 group-hover:text-gold transition-colors flex-1">
                        {noticia.titulo}
                      </h3>
                      <p className="text-gray-600 text-sm leading-relaxed mb-4">
                        {noticia.resumen}
                      </p>
                      <span className="mt-auto inline-flex items-center gap-1 text-gold text-sm font-bold group-hover:gap-2 transition-[gap]">
                        Leer más <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
          {hayMas && (
            <div className="mt-10 text-center">
              <button
                type="button"
                onClick={cargarMas}
                disabled={cargandoMas}
                className="px-6 py-3 rounded-full bg-primary text-white text-sm font-bold hover:bg-primary/90 disabled:opacity-60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
              >
                {cargandoMas ? 'Cargando…' : 'Cargar más'}
              </button>
            </div>
          )}
        </div>
      </section>
    </PageWrapper>
  );
}
