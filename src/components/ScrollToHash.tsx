import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Controla el scroll al navegar:
 * - Entre subsecciones de UNA MISMA sección: NO toca el scroll. El banner y las
 *   pestañas permanecen fijos (sin salto ni parpadeo); solo cambia el contenido.
 * - Al entrar a una sección nueva o a una página suelta: sube al tope (banner visible).
 * - Si hay hash, desplaza al elemento correspondiente (compatibilidad).
 */
export default function ScrollToHash() {
  const { pathname, hash } = useLocation();
  const prevPathRef = useRef<string | null>(null);

  useEffect(() => {
    const prevParts = (prevPathRef.current || '').split('/').filter(Boolean);
    const curParts = pathname.split('/').filter(Boolean);
    prevPathRef.current = pathname;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const behavior = prefersReducedMotion ? 'auto' : 'smooth';

    if (hash) {
      setTimeout(() => {
        const element = document.getElementById(hash.replace('#', ''));
        if (element) element.scrollIntoView({ behavior, block: 'start' });
      }, 100);
      return;
    }

    // Cambio entre subsecciones de la misma sección (ruta con 2+ segmentos dentro
    // de la misma base): no se modifica el scroll para que el banner se quede fijo
    // y solo cambie el contenido de abajo.
    const isSubsectionSwitch =
      curParts.length >= 2 && curParts[0] === prevParts[0];
    if (isSubsectionSwitch) return;

    // Entrada a una sección nueva o a una página suelta: al tope (banner visible).
    window.scrollTo({ top: 0, behavior });
  }, [pathname, hash]);

  return null;
}
