import { NavLink, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { X } from 'lucide-react';
import { branding, site } from '../../profile';
import { useSesion } from '../sesion/SesionContext';
import { MENU_PANEL, type ItemMenu } from './rutasPanel';
import { consultaPendientesRevision } from './pendientesRevision';

function Contador({ n }: { n: number }) {
  if (!n) return null;
  return (
    <span className="ml-auto inline-flex min-w-6 items-center justify-center rounded-full bg-gold px-1.5 text-xs font-bold text-ink">
      {n > 99 ? '99+' : n}
      <span className="sr-only"> pendientes</span>
    </span>
  );
}

function Enlace({ item, pendientes, alNavegar }: { item: ItemMenu; pendientes: number; alNavegar?: () => void }) {
  const { pathname } = useLocation();
  const extra = item.activoEn?.some((p) => pathname.startsWith(p)) ?? false;
  const Icono = item.icono;
  return (
    <NavLink
      to={item.a}
      end={item.exacto}
      onClick={alNavegar}
      className={({ isActive }) =>
        clsx(
          'group flex items-center gap-3 rounded-md border-l-4 py-2.5 pl-3 pr-3 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold',
          isActive || extra
            ? 'border-gold bg-white/10 text-white'
            : 'border-transparent text-white/75 hover:bg-white/5 hover:text-white',
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icono
            aria-hidden="true"
            className={clsx('h-5 w-5 shrink-0', isActive || extra ? 'text-gold' : 'text-white/60 group-hover:text-white')}
          />
          <span>{item.etiqueta}</span>
          {item.contador === 'revision' && <Contador n={pendientes} />}
        </>
      )}
    </NavLink>
  );
}

/**
 * Barra lateral del panel (`bg-primary`, ítem activo con acento dorado).
 * En escritorio es fija; en móvil es un cajón que abre la barra superior.
 */
export function BarraLateral({ abierta, onCerrar }: { abierta: boolean; onCerrar: () => void }) {
  const { usuario, tieneRol } = useSesion();
  const esRevisor = tieneRol('Revisor');
  const pendientes = useQuery({
    ...consultaPendientesRevision,
    enabled: esRevisor,
    refetchInterval: 60_000,
  });
  const items = MENU_PANEL.filter((i) => usuario && i.roles.includes(usuario.rol));

  const contenido = (alNavegar?: () => void) => (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-4">
        <img src={branding.logos.escuela} alt="" className="h-11 w-auto max-w-[4.5rem] shrink-0 rounded bg-white object-contain p-1" />
        <div className="min-w-0 leading-tight">
          <p className="truncate font-display text-sm font-bold text-white">{site.programa.nombreCorto}</p>
          <p className="text-xs text-white/70">Panel de gestión · {site.universidad.siglas}</p>
        </div>
      </div>
      <nav aria-label="Menú del panel" className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {items.map((i) => (
            <li key={i.a}>
              <Enlace item={i} pendientes={pendientes.data?.length ?? 0} alNavegar={alNavegar} />
            </li>
          ))}
        </ul>
      </nav>
      <div className="border-t border-white/10 px-4 py-3 text-xs text-white/60">
        <a href="/" className="hover:text-white hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-gold">
          Ir al sitio público
        </a>
      </div>
    </div>
  );

  return (
    <>
      {/* Escritorio */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 bg-primary lg:block">{contenido()}</aside>

      {/* Móvil: cajón */}
      <div
        className={clsx(
          'fixed inset-0 z-50 transition-[visibility] duration-200 lg:hidden',
          abierta ? 'visible' : 'pointer-events-none invisible',
        )}
      >
        <button
          type="button"
          tabIndex={-1}
          aria-label="Cerrar menú"
          onClick={onCerrar}
          className={clsx('absolute inset-0 bg-ink/50 transition-opacity', abierta ? 'opacity-100' : 'opacity-0')}
        />
        <aside
          id="panel-menu-movil"
          aria-label="Menú del panel"
          className={clsx(
            'absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-primary shadow-xl transition-transform duration-200',
            abierta ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar menú"
            className="absolute right-2 top-3 inline-flex h-10 w-10 items-center justify-center rounded-md text-white/80 hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
          {contenido(onCerrar)}
        </aside>
      </div>
    </>
  );
}

export default BarraLateral;
