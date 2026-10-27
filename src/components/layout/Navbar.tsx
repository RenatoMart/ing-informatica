import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { Phone, Mail, Search, ChevronDown, Menu, X, ExternalLink } from 'lucide-react';
import { site, branding } from '@/profile';
import { informacionContacto } from '@profile/content/contacto';
import Breadcrumbs from './Breadcrumbs';
import AnnouncementBanner from './AnnouncementBanner';
import { NAV_LINKS, expandNavLinks } from '@/navigation';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  // Sección con el mega-menú abierto (hover/foco). Solo para semántica ARIA:
  // la visibilidad sigue siendo CSS (group-hover / group-focus-within).
  const [openSection, setOpenSection] = useState<string | null>(null);
  const location = useLocation();
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // Cierra el drawer móvil y devuelve el foco al botón que lo abrió.
  const closeMenu = () => {
    setIsOpen(false);
    menuButtonRef.current?.focus();
  };

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement> | React.MouseEvent) => {
    if (('key' in e && e.key === 'Enter') || e.type === 'click') {
      if (searchTerm.trim()) {
        // Acota al dominio de la universidad si el perfil lo define; si no, búsqueda general.
        const dominio = site.universidad.dominio?.trim();
        const filtro = dominio ? `site:${dominio}+` : '';
        window.open(`https://www.google.com/search?q=${filtro}${encodeURIComponent(searchTerm.trim())}`, '_blank');
      }
    }
  };

  useEffect(() => {
    // Solo añade una sombra al header cuando se separa del tope. Listener pasivo
    // para no interferir con el rendimiento del scroll.
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname, location.hash]);

  // Mientras el drawer está abierto: bloquea el scroll del fondo y permite
  // cerrarlo con Escape (devolviendo el foco al botón). Patrón de diálogo.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <header 
      className={clsx(
        'sticky top-0 z-50 w-full transition duration-300',
        scrolled ? 'bg-white shadow-md' : 'bg-white'
      )}
    >
      {/* Top Bar */}
      <div className="bg-primary text-gray-300 text-[13px] py-2 border-b-2 border-gold hidden md:block">
        <div className="container mx-auto px-4 md:px-8 flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-0">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 md:gap-8">
            <span className="font-semibold text-white">¿Tienes alguna duda?</span>
            <span className="flex items-center gap-1.5 hover:text-gold transition-colors cursor-pointer">
              <Phone className="w-4 h-4" />
              {informacionContacto.telefonos[0]}
            </span>
            <span className="flex items-center gap-1.5 hover:text-gold transition-colors cursor-pointer">
              <Mail className="w-4 h-4" />
              {informacionContacto.correo}
            </span>
          </div>
          <div className="flex items-center">
            <div className="relative group flex items-center">
              <input
                type="text"
                placeholder="Buscar..."
                aria-label="Buscar en el sitio"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleSearch}
                className="bg-transparent text-white placeholder-gray-400 text-[13px] px-3 py-1 outline-none border-b border-transparent focus:border-gold transition-[width,border-color] w-32 focus:w-48"
              />
              <Search 
                className="w-4 h-4 text-gray-400 ml-1 hover:text-gold cursor-pointer transition-colors" 
                onClick={handleSearch}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Banner de Avisos Institucionales */}
      <AnnouncementBanner />

      <div className="container mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between">
          {/* Logo / Marca */}
          <Link to="/" className="flex items-center gap-3 md:gap-4 group py-3">
            <div className="flex items-center gap-3 md:gap-4">
              {/* Isologo de la Universidad */}
              <img
                src={branding.logos.universidad}
                alt={branding.alt.universidad}
                className="h-16 sm:h-20 md:h-[112px] w-auto object-contain"
              />
              {/* Separador entre el isologo y el nombre del programa */}
              <span className="block w-px h-10 sm:h-12 md:h-20 bg-gray-300" aria-hidden="true" />
            </div>
            <div className="flex flex-col ml-1 md:ml-3">
              <span className="font-display font-black tracking-tight leading-[0.95] text-base sm:text-lg md:text-3xl flex flex-col">
                <span className="text-primary">{site.wordmark.linea1}</span>
                <span className="text-gold">{site.wordmark.linea2}</span>
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center bg-primary mr-5">
            {NAV_LINKS.map((link, idx) => (
              <div
                key={link.name}
                className="relative group h-full flex"
                onMouseEnter={() => link.groups && setOpenSection(link.name)}
                onMouseLeave={() => setOpenSection((s) => (s === link.name ? null : s))}
                onFocus={() => link.groups && setOpenSection(link.name)}
                onBlur={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget)) {
                    setOpenSection((s) => (s === link.name ? null : s));
                  }
                }}
              >
                <NavLink
                  to={link.path}
                  end={link.path === '/'}
                  aria-haspopup={link.groups ? 'true' : undefined}
                  aria-expanded={link.groups ? openSection === link.name : undefined}
                  // Tras un clic de ratón el enlace conserva el foco y `group-focus-within`
                  // mantendría el mega-menú abierto hasta hacer clic fuera. Lo soltamos para
                  // que se cierre al retirar el puntero. El acceso por teclado (Tab) sigue
                  // abriendo el menú vía focus-within, intacto.
                  onClick={(e) => e.currentTarget.blur()}
                  className={({ isActive }) => clsx(
                  'font-body font-medium text-[16px] transition-colors flex items-center px-7 py-5 md:py-6',
                  isActive ? 'bg-gold text-white' : 'text-white hover:bg-white/10'
                  )}
                >
                  {link.name}
                  {link.groups && (
                    <ChevronDown className="w-4 h-4 ml-1 opacity-70" />
                  )}
                </NavLink>

                {/* Mega-menú agrupado por subcategorías. Mismo chrome que el
                    desplegable original: cuadrado, shadow-lg, sin borde. Los de la
                    mitad derecha se anclan a la derecha para no salirse de pantalla. */}
                {link.groups && (
                  <div className={clsx(
                    'absolute top-full bg-white shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-opacity duration-200 z-50',
                    idx >= 3 ? 'right-0' : 'left-0'
                  )}>
                    <div className="flex flex-wrap gap-x-2 gap-y-4 p-4 max-w-[min(720px,90vw)]">
                      {link.groups.map((grupo) => (
                        <div key={grupo.label} className="min-w-[200px] flex-1">
                          <p className="px-3 pb-2 mb-1 text-[11px] font-black uppercase tracking-wider text-gold border-b border-gray-100">
                            {grupo.label}
                          </p>
                          <div className="flex flex-col">
                            {expandNavLinks(grupo.items).map((item) =>
                              item.external ? (
                                <a
                                  key={item.name}
                                  href={item.path}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.currentTarget.blur()}
                                  className="flex items-center justify-between gap-2 px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 hover:text-primary transition-colors"
                                >
                                  <span>{item.name}<span className="sr-only"> (abre en pestaña nueva)</span></span>
                                  <ExternalLink className="w-3.5 h-3.5 opacity-50 shrink-0" />
                                </a>
                              ) : (
                                <Link
                                  key={item.name}
                                  to={item.path}
                                  onClick={(e) => e.currentTarget.blur()}
                                  className="block px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 hover:text-primary transition-colors"
                                >
                                  {item.name}
                                </Link>
                              )
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Mobile Toggle */}
          <button
            ref={menuButtonRef}
            className="lg:hidden text-primary p-2.5 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            onClick={() => setIsOpen((o) => !o)}
            aria-label="Abrir menú"
            aria-haspopup="dialog"
            aria-controls="menu-movil"
            aria-expanded={isOpen}
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Mobile Nav: drawer que entra desde la derecha sobre un overlay
          (flota sobre el contenido, no lo empuja). Cierra con backdrop,
          botón o Escape; bloquea el scroll del fondo mientras está abierto. */}
      <AnimatePresence>
        {isOpen && (
          <div className="lg:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={closeMenu}
              className="fixed inset-0 z-40 bg-primary/50"
              aria-hidden="true"
            />

            {/* Panel deslizante */}
            <motion.div
              id="menu-movil"
              role="dialog"
              aria-modal="true"
              aria-label="Menú de navegación"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', ease: [0.4, 0, 0.2, 1], duration: 0.3 }}
              className="fixed top-0 right-0 z-50 h-[100dvh] w-[85vw] max-w-sm bg-white shadow-2xl flex flex-col"
            >
              {/* Cabecera: solo el control de cierre */}
              <div className="flex items-center justify-end px-5 h-16 border-b border-gray-100 shrink-0">
                <button
                  type="button"
                  autoFocus
                  onClick={closeMenu}
                  aria-label="Cerrar menú"
                  className="p-1.5 -mr-1.5 text-primary rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Contenido scrollable */}
              <nav
                aria-label="Menú principal"
                className="flex-1 overflow-y-auto overscroll-contain px-5 py-5 flex flex-col gap-5"
              >
                {NAV_LINKS.map((link) => (
                  <div key={link.name} className="flex flex-col">
                    <NavLink
                      to={link.path}
                      end={link.path === '/'}
                      className={({ isActive }) => clsx(
                        'font-display font-bold py-1',
                        isActive ? 'text-gold' : 'text-primary'
                      )}
                    >
                      {link.name}
                    </NavLink>
                    {link.groups && (
                      <div className="mt-2 ml-1 pl-4 border-l border-gray-200 flex flex-col gap-3">
                        {link.groups.map((grupo) => (
                          <div key={grupo.label} className="flex flex-col">
                            <p className="text-[10px] font-black uppercase tracking-wider text-gold mb-1">
                              {grupo.label}
                            </p>
                            <div className="flex flex-col">
                              {expandNavLinks(grupo.items).map((item) =>
                                item.external ? (
                                  <a
                                    key={item.name}
                                    href={item.path}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-primary py-2"
                                  >
                                    {item.name}<span className="sr-only"> (abre en pestaña nueva)</span>
                                    <ExternalLink className="w-3 h-3 opacity-50" />
                                  </a>
                                ) : (
                                  <Link
                                    key={item.name}
                                    to={item.path}
                                    className="text-sm text-gray-600 hover:text-primary py-2"
                                  >
                                    {item.name}
                                  </Link>
                                )
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </nav>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Breadcrumbs />
    </header>
  );
}