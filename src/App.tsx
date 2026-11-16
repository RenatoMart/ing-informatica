import React, { useEffect } from 'react';
import { AnimatePresence, MotionConfig } from 'framer-motion';
import AppRouter from './router/index';
import FloatingSocials from './components/layout/FloatingSocials';
import { seo } from './profile';
import { useContenido } from './data/almacen';

export default function App() {
  // Suscripción general: cuando cambia alguna sección del contenido, React vuelve a pintar el árbol SIN desmontarlo
  // (se conserva el estado de cada componente) y solo actualiza en pantalla lo que es distinto.
  useContenido();
  const versionSeo = useContenido('seo');

  // SEO del perfil activo: título, idioma y descripción se aplican desde el perfil.
  useEffect(() => {
    document.title = seo.title;
    document.documentElement.lang = seo.lang;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', seo.description);
  }, [versionSeo]);

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence mode="wait">
        <AppRouter />
      </AnimatePresence>
      <FloatingSocials />
    </MotionConfig>
  );
}