import React, { useEffect } from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import PageHero from '../../components/layout/PageHero';
import EnConstruccion from '../../components/layout/EnConstruccion';
import { site, siteName } from '@/profile';
import { GraduationCap, Download } from 'lucide-react';
import { fechaCorta, useAdmision, useDocumentos, useRegistrarVisita } from '../../data/ConsultarInformacionController';

export default function GuiaPostulante() {
  useRegistrarVisita('admision');
  const { datos: guias, cargando: cargandoGuia } = useDocumentos('guia');
  const adm = useAdmision();
  const guia = guias?.find((g) => g.archivo_url);
  const cronograma = adm.estado === 'api' ? adm.datos.cronograma : [];
  const cargando = cargandoGuia || adm.estado === 'cargando';

  useEffect(() => {
    document.title = `Guía del postulante | Admisión | ${siteName}`;
  }, []);

  return (
    <PageWrapper>
      <PageHero
        title="Guía del postulante"
        subtitle={`Todo lo que necesitas saber para postular al ${site.programa.nombre}.`}
        icon={GraduationCap}
        breadcrumbs={[{ label: 'Admisión' }, { label: 'Guía del postulante' }]}
      />
      {cargando ? (
        <div className="container mx-auto px-4 md:px-8 py-16" aria-busy="true">
          <div className="h-48 rounded-xl bg-gray-100 animate-pulse" />
        </div>
      ) : !guia && cronograma.length === 0 ? (
        <EnConstruccion titulo="Guía del postulante" />
      ) : (
        <section className="py-12 md:py-16 bg-gray-50">
          <div className="container mx-auto px-4 md:px-8 max-w-3xl space-y-10">
            {guia && (
              <div className="bg-white rounded-xl border border-gray-100 p-6 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <h3 className="font-display font-bold text-primary">{guia.titulo}</h3>
                  {guia.fecha_vigencia && <p className="text-xs text-gray-600 mt-1">Vigente hasta {fechaCorta(guia.fecha_vigencia)}</p>}
                </div>
                <a
                  href={guia.archivo_url as string}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors"
                >
                  <Download className="w-4 h-4" aria-hidden="true" /> Descargar guía (PDF)
                </a>
              </div>
            )}
            {cronograma.length > 0 && adm.estado === 'api' && (
              <div>
                <h3 className="font-display font-bold text-primary text-xl mb-4">
                  Cronograma de admisión {adm.datos.campana.anio}-{adm.datos.campana.proceso}
                </h3>
                <ul className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100">
                  {cronograma.map((h, i) => (
                    <li key={i} className="flex justify-between gap-4 px-5 py-3 text-sm">
                      <span className="text-gray-800">{h.hito}</span>
                      <span className="font-semibold text-primary whitespace-nowrap">{fechaCorta(h.fecha)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}
    </PageWrapper>
  );
}
