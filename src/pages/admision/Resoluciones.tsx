import React, { useEffect, useState } from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import PageHero from '../../components/layout/PageHero';
import EnConstruccion from '../../components/layout/EnConstruccion';
import { siteName } from '@/profile';
import { FileText, Download } from 'lucide-react';
import { fechaCorta, useDocumentos, useRegistrarVisita } from '../../data/ConsultarInformacionController';

export default function Resoluciones() {
  useRegistrarVisita('documentos');
  const [historicos, setHistoricos] = useState(false);
  const { datos, cargando } = useDocumentos('resolucion', historicos);
  const lista = datos ?? [];

  useEffect(() => {
    document.title = `Resoluciones | Admisión | ${siteName}`;
  }, []);

  return (
    <PageWrapper>
      <PageHero
        title="Resoluciones"
        subtitle="Documentos y resoluciones oficiales del proceso de admisión."
        icon={FileText}
        breadcrumbs={[{ label: 'Admisión' }, { label: 'Resoluciones' }]}
      />
      {cargando ? (
        <div className="container mx-auto px-4 md:px-8 py-16" aria-busy="true">
          <div className="h-48 rounded-xl bg-gray-100 animate-pulse" />
        </div>
      ) : lista.length === 0 && !historicos ? (
        <EnConstruccion titulo="Resoluciones" />
      ) : (
        <section className="py-12 md:py-16 bg-gray-50">
          <div className="container mx-auto px-4 md:px-8 max-w-4xl">
            <label className="flex items-center gap-2 text-sm font-semibold text-primary mb-6 cursor-pointer">
              <input type="checkbox" checked={historicos} onChange={(e) => setHistoricos(e.target.checked)} className="accent-primary w-4 h-4" />
              Ver históricas
            </label>
            {lista.length === 0 ? (
              <p className="text-gray-600">No hay resoluciones para mostrar.</p>
            ) : (
              <ul className="space-y-3">
                {lista.map((d) => (
                  <li key={d.id_documento} className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      {d.numero && <p className="text-xs font-black uppercase tracking-wider text-gold">{d.numero}</p>}
                      <h3 className="font-display font-bold text-primary leading-snug">{d.titulo}</h3>
                      <p className="text-xs text-gray-600 mt-1">
                        {d.fecha_emision && <>Emisión: {fechaCorta(d.fecha_emision)}</>}
                        {d.fecha_vigencia && <> · Vigencia: {fechaCorta(d.fecha_vigencia)}</>}
                        {d.departamento && <> · {d.departamento}</>}
                        {d.estado === 'historico' && <> · Histórica</>}
                      </p>
                    </div>
                    {d.archivo_url && (
                      <a
                        href={d.archivo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors shrink-0"
                      >
                        <Download className="w-4 h-4" aria-hidden="true" /> PDF
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}
    </PageWrapper>
  );
}
