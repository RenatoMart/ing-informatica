import { useEffect, type ReactNode } from 'react';
import { branding, site, siteName } from '../../profile';

/** Marco centrado de las pantallas de acceso (login, recuperar, cambiar contraseña…). */
export function MarcoAutenticacion({
  titulo,
  subtitulo,
  children,
  pie,
}: {
  titulo: string;
  subtitulo?: ReactNode;
  children: ReactNode;
  pie?: ReactNode;
}) {
  useEffect(() => {
    document.title = `${titulo} · Panel · ${siteName}`;
  }, [titulo]);

  return (
    <div className="flex min-h-[100svh] flex-col bg-gray-50 font-sans text-ink">
      <div aria-hidden="true" className="h-1.5 bg-gradient-to-r from-primary via-primary to-gold" />
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="mb-6 flex items-center justify-center gap-3">
            <img src={branding.logos.escuela} alt="" className="h-14 w-auto max-w-[5rem] object-contain" />
            <div className="leading-tight">
              <p className="font-display text-base font-bold text-primary">{site.programa.nombre}</p>
              <p className="text-xs text-gray-600">{site.universidad.nombre} · Intranet</p>
            </div>
          </div>
          <section className="rounded-xl border border-gray-200 bg-white px-6 py-7 shadow-sm sm:px-8">
            <h1 className="font-display text-2xl font-bold text-ink">{titulo}</h1>
            {subtitulo && <p className="mt-1.5 text-sm text-gray-600">{subtitulo}</p>}
            <div className="mt-6">{children}</div>
          </section>
          {pie && <div className="mt-5 text-center text-sm text-gray-600">{pie}</div>}
          <p className="mt-6 text-center text-xs text-gray-500">
            <a href="/" className="hover:text-primary hover:underline">
              ← Volver al sitio público
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}

export default MarcoAutenticacion;
