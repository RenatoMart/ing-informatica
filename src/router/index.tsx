import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SitioPublico, { RouteFallback } from './SitioPublico';

// Panel de control: chunk perezoso aparte; el visitante público nunca lo descarga.
const PanelApp = lazy(() => import('../panel/PanelApp'));

/**
 * Router raíz (docs/DISENO_BACKEND.md §6.1):
 * - `/panel/*` → panel de gestión, sin Navbar/Footer ni flotantes públicos.
 * - todo lo demás → `SitioPublico` (layout institucional + rutas públicas).
 */
export default function AppRouter() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route
          path="/panel/*"
          element={
            <Suspense fallback={<RouteFallback />}>
              <PanelApp />
            </Suspense>
          }
        />
        <Route path="*" element={<SitioPublico />} />
      </Routes>
    </BrowserRouter>
  );
}
