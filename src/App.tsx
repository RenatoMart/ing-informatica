import { useEffect } from 'react';
import { AnimatePresence, MotionConfig } from 'framer-motion';
import { QueryClientProvider } from '@tanstack/react-query';
import AppRouter from './router/index';
import { queryClient } from './lib/queryClient';
import { seo } from './profile';

export default function App() {
  // SEO del perfil activo: título, idioma y descripción se aplican desde el perfil.
  useEffect(() => {
    document.title = seo.title;
    document.documentElement.lang = seo.lang;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', seo.description);
  }, []);

  // FloatingSocials vive ahora en SitioPublico (no se muestra en /panel).
  return (
    <QueryClientProvider client={queryClient}>
      <MotionConfig reducedMotion="user">
        <AnimatePresence mode="wait">
          <AppRouter />
        </AnimatePresence>
      </MotionConfig>
    </QueryClientProvider>
  );
}
