import { useLayoutEffect, useState } from 'react';

/**
 * Mide en tiempo real la altura del <header> sticky (Navbar), que es variable
 * (banner de avisos descartable, breakpoints responsive). Sirve para anclar la
 * barra de pestañas de sección justo debajo de la cabecera al hacer scroll.
 */
export default function useHeaderHeight() {
  const [height, setHeight] = useState(0);

  useLayoutEffect(() => {
    const header = document.querySelector('header');
    if (!header) return;

    const update = () => setHeight(header.offsetHeight);
    update();

    const observer = new ResizeObserver(update);
    observer.observe(header);
    window.addEventListener('resize', update);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  return height;
}
