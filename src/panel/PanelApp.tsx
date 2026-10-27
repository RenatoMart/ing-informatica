/**
 * Raíz del panel (`/panel/*`), cargada en un chunk perezoso aparte del sitio
 * público. Monta la sesión, los avisos y las rutas declaradas en
 * `layout/rutasPanel.ts` (ver la convención allí).
 */
import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { SesionProvider } from './sesion/SesionContext';
import { RutaInvitado, RutaProtegida } from './sesion/RutaProtegida';
import { ToastProvider } from './componentes/Toast';
import { Cargando, Vacio } from './componentes/Estados';
import { PanelLayout } from './layout/PanelLayout';
import { PantallaPendiente } from './layout/PantallaPendiente';
import { REDIRECCIONES_PANEL, RUTAS_PANEL, componenteVista } from './layout/rutasPanel';
import PaginaNoAutorizado from './vistas/PaginaNoAutorizado';
import { BotonEnlace } from './componentes/Boton';

const PaginaLogin = lazy(() => import('./vistas/PaginaLogin'));
const PaginaRecuperar = lazy(() => import('./vistas/PaginaRecuperar'));
const PaginaRestablecer = lazy(() => import('./vistas/PaginaRestablecer'));
const PaginaCambiarContrasena = lazy(() => import('./vistas/PaginaCambiarContrasena'));

// Componentes perezosos resueltos una sola vez (null = vista aún no creada).
const PANTALLAS = RUTAS_PANEL.map((r) => ({ ...r, Vista: componenteVista(r.vista) }));

function NoEncontradoPanel() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <Vacio
        titulo="Página no encontrada"
        descripcion="La dirección no corresponde a ninguna sección del panel."
        accion={<BotonEnlace to="/panel">Ir al inicio del panel</BotonEnlace>}
      />
    </div>
  );
}

export default function PanelApp() {
  return (
    <SesionProvider>
      <ToastProvider>
        <Suspense fallback={<Cargando pantallaCompleta />}>
          <Routes>
            {/* Invitado */}
            <Route element={<RutaInvitado />}>
              <Route path="login" element={<PaginaLogin />} />
              <Route path="recuperar" element={<PaginaRecuperar />} />
              <Route path="restablecer" element={<PaginaRestablecer />} />
            </Route>

            {/* Autenticado, permitido aunque deba cambiar la contraseña */}
            <Route
              path="cambiar-contrasena"
              element={
                <RutaProtegida permitirCambioPendiente>
                  <PaginaCambiarContrasena />
                </RutaProtegida>
              }
            />

            {/* Autenticado, con el layout del panel */}
            <Route
              element={
                <RutaProtegida>
                  <PanelLayout />
                </RutaProtegida>
              }
            >
              {PANTALLAS.map(({ ruta, vista, titulo, roles, Vista }) => {
                const elemento = (
                  <RutaProtegida roles={roles}>
                    {Vista ? <Vista /> : <PantallaPendiente titulo={titulo} vista={vista} />}
                  </RutaProtegida>
                );
                return ruta === '' ? (
                  <Route key="indice" index element={elemento} />
                ) : (
                  <Route key={ruta} path={ruta} element={elemento} />
                );
              })}
              {Object.entries(REDIRECCIONES_PANEL).map(([desde, hacia]) => (
                <Route key={desde} path={desde} element={<Navigate to={hacia} replace />} />
              ))}
              <Route path="no-autorizado" element={<PaginaNoAutorizado />} />
              <Route path="*" element={<NoEncontradoPanel />} />
            </Route>
          </Routes>
        </Suspense>
      </ToastProvider>
    </SesionProvider>
  );
}
