import { Component, Suspense, useEffect, useState, type ErrorInfo, type ReactNode } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { BarraLateral } from './BarraLateral';
import { BarraSuperior } from './BarraSuperior';
import { Cargando, ErrorEstado } from '../componentes/Estados';

/** Captura errores de render (p.ej. un chunk que no carga) de una pantalla. */
export class LimiteError extends Component<{ children: ReactNode; claveReinicio?: string }, { error: unknown }> {
  state = { error: null as unknown };
  static getDerivedStateFromError(error: unknown) {
    return { error };
  }
  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error('[panel] Error de render', error, info.componentStack);
  }
  componentDidUpdate(prev: { claveReinicio?: string }) {
    if (this.state.error && prev.claveReinicio !== this.props.claveReinicio) this.setState({ error: null });
  }
  render() {
    if (this.state.error) {
      return (
        <ErrorEstado
          titulo="No se pudo mostrar esta pantalla"
          error={this.state.error}
          onReintentar={() => window.location.reload()}
        />
      );
    }
    return this.props.children;
  }
}

/** Estructura del panel: barra lateral + cabecera + área de trabajo `bg-gray-50`. */
export function PanelLayout({ children }: { children?: ReactNode }) {
  const [menu, setMenu] = useState(false);
  const { pathname } = useLocation();

  // Al navegar, vuelve arriba (el cajón móvil se cierra desde sus enlaces).
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  // Cierra el cajón móvil con Escape.
  useEffect(() => {
    if (!menu) return;
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setMenu(false);
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [menu]);

  return (
    <div className="min-h-[100svh] bg-gray-50 font-sans text-ink">
      <a
        href="#contenido-panel"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[200] focus:rounded-md focus:bg-gold focus:px-4 focus:py-2 focus:font-semibold focus:text-ink"
      >
        Saltar al contenido
      </a>
      <BarraLateral abierta={menu} onCerrar={() => setMenu(false)} />
      <div className="lg:pl-64">
        <BarraSuperior menuAbierto={menu} onAbrirMenu={() => setMenu(true)} />
        <main id="contenido-panel" tabIndex={-1} className="mx-auto w-full max-w-7xl px-4 py-6 focus:outline-none sm:px-6 lg:px-8 lg:py-8">
          <LimiteError claveReinicio={pathname}>
            <Suspense fallback={<Cargando />}>{children ?? <Outlet />}</Suspense>
          </LimiteError>
        </main>
      </div>
    </div>
  );
}

export default PanelLayout;
