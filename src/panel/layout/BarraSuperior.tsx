import { useEffect, useId, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, KeyRound, LogOut, Menu } from 'lucide-react';
import { useAutenticacionController } from '../controladores/AutenticacionController';

function iniciales(nombres: string, apellidos: string) {
  return `${nombres.trim()[0] ?? ''}${apellidos.trim()[0] ?? ''}`.toUpperCase();
}

/** Cabecera del panel: botón de menú (móvil) y menú del usuario. */
export function BarraSuperior({ menuAbierto, onAbrirMenu }: { menuAbierto: boolean; onAbrirMenu: () => void }) {
  const { sesion, estado, acciones } = useAutenticacionController();
  const usuario = sesion.usuario;
  const navegar = useNavigate();
  const [abierto, setAbierto] = useState(false);
  const idMenu = useId();
  const contenedor = useRef<HTMLDivElement>(null);
  const boton = useRef<HTMLButtonElement>(null);

  // Cierra el menú del usuario con clic fuera o Escape.
  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: MouseEvent) => {
      if (!contenedor.current?.contains(e.target as Node)) setAbierto(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAbierto(false);
        boton.current?.focus();
      }
    };
    document.addEventListener('mousedown', fuera);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', fuera);
      document.removeEventListener('keydown', esc);
    };
  }, [abierto]);

  const salir = async () => {
    setAbierto(false);
    await acciones.cerrarSesion();
    navegar('/panel/login', { replace: true });
  };

  if (!usuario) return null;

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-gray-200 bg-white/95 px-4 backdrop-blur sm:px-6">
      <button
        type="button"
        onClick={onAbrirMenu}
        aria-label="Abrir menú"
        aria-controls="panel-menu-movil"
        aria-expanded={menuAbierto}
        className="-ml-1 inline-flex h-10 w-10 items-center justify-center rounded-md text-primary hover:bg-primary/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold lg:hidden"
      >
        <Menu aria-hidden="true" className="h-6 w-6" />
      </button>
      <p className="font-display text-base font-bold text-primary lg:hidden">Panel</p>

      <div ref={contenedor} className="relative ml-auto">
        <button
          ref={boton}
          type="button"
          onClick={() => setAbierto((v) => !v)}
          aria-expanded={abierto}
          aria-controls={idMenu}
          className="flex items-center gap-3 rounded-md px-2 py-1.5 text-left hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          <span
            aria-hidden="true"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary font-display text-sm font-bold text-white"
          >
            {iniciales(usuario.nombres, usuario.apellidos)}
          </span>
          <span className="hidden leading-tight sm:block">
            <span className="block text-sm font-semibold text-ink">
              {usuario.nombres} {usuario.apellidos}
            </span>
            <span className="block text-xs text-gray-600">{usuario.cargo || usuario.rol_etiqueta || usuario.rol}</span>
          </span>
          <span className="sr-only">Menú de la cuenta</span>
          <ChevronDown aria-hidden="true" className="h-4 w-4 text-gray-500" />
        </button>

        {abierto && (
          <div
            id={idMenu}
            className="absolute right-0 mt-2 w-72 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg"
          >
            <div className="border-b border-gray-100 px-4 py-3 text-sm">
              <p className="font-semibold text-ink">
                {usuario.nombres} {usuario.apellidos}
              </p>
              <p className="truncate text-gray-600">{usuario.correo_institucional}</p>
              <p className="mt-1 inline-block rounded bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                {usuario.rol_etiqueta || usuario.rol}
              </p>
            </div>
            <ul className="py-1 text-sm">
              <li>
                <Link
                  to="/panel/cambiar-contrasena"
                  onClick={() => setAbierto(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-ink hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                >
                  <KeyRound aria-hidden="true" className="h-4 w-4 text-gray-500" /> Cambiar contraseña
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={salir}
                  disabled={estado.cerrando}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-danger hover:bg-red-50 focus:bg-red-50 focus:outline-none"
                >
                  <LogOut aria-hidden="true" className="h-4 w-4" /> {estado.cerrando ? 'Cerrando sesión…' : 'Cerrar sesión'}
                </button>
              </li>
            </ul>
          </div>
        )}
      </div>
    </header>
  );
}

export default BarraSuperior;
