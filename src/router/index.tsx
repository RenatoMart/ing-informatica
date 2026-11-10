import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import FloatingAdmissions from '../components/layout/FloatingAdmissions';
import ScrollToHash from '../components/ScrollToHash';
import EnConstruccion from '../components/layout/EnConstruccion';

// Inicio se carga de forma inmediata (es la primera pantalla / LCP).
import Inicio from '../pages/Inicio';

// El resto de páginas se cargan bajo demanda (code-splitting): cada ruta trae
// su propio chunk solo al visitarla, así la carga inicial es mucho más ligera.
const Noticias = lazy(() => import('../pages/Noticias'));
const NoticiaDetalle = lazy(() => import('../pages/NoticiaDetalle'));
const Contacto = lazy(() => import('../pages/Contacto'));
const NotFound = lazy(() => import('../pages/NotFound'));

// Módulo: Nosotros
const NosotrosIndex = lazy(() => import('../pages/nosotros/index'));
const Historia = lazy(() => import('../pages/nosotros/Historia'));
const MisionVision = lazy(() => import('../pages/nosotros/MisionVision')); // Misión + Visión (#mision / #vision)
// Formación: el archivo vive en pages/nosotros/ pero ahora se monta bajo /academico.
const Objetivos = lazy(() => import('../pages/nosotros/Objetivos'));        // educativos + académicos
const Perfiles = lazy(() => import('../pages/nosotros/Perfiles'));          // ingreso + egreso

// Módulo: Organización
const OrganizacionIndex = lazy(() => import('../pages/organizacion/index'));
const OrganizacionDireccion = lazy(() => import('../pages/organizacion/Direccion')); // escuela + departamento
const OrganosGobierno = lazy(() => import('../pages/organizacion/OrganosGobierno')); // decano + centro federado
const Comites = lazy(() => import('../pages/organizacion/Comites'));                 // los 5 comités
const Administrativos = lazy(() => import('../pages/organizacion/Administrativos'));

// Módulo: Académico
const AcademicoIndex = lazy(() => import('../pages/academico/index'));
const PlanEstudios = lazy(() => import('../pages/academico/PlanEstudios'));
const Titulacion = lazy(() => import('../pages/academico/Titulacion'));

// Módulo: Investigación
const InvestigacionIndex = lazy(() => import('../pages/investigacion/index'));
const Lineas = lazy(() => import('../pages/investigacion/Lineas'));
const Publicaciones = lazy(() => import('../pages/investigacion/Publicaciones'));
const ProyectosGrupo = lazy(() => import('../pages/investigacion/ProyectosGrupo')); // proyectos + tesis
const Laboratorios = lazy(() => import('../pages/academico/Laboratorios'));
const Estadisticas = lazy(() => import('../pages/admision/Estadisticas'));
const Convenios = lazy(() => import('../pages/investigacion/convenios'));
const Revistas = lazy(() => import('../pages/investigacion/Revistas'));            // reutilizado en Académico
const Movilidad = lazy(() => import('../pages/academico/Movilidad'));

// Páginas reutilizadas
const Docentes = lazy(() => import('../pages/autoridades/Docentes'));       // Organización › Docentes
const MapaProcesos = lazy(() => import('../pages/autoridades/MapaProcesos')); // Organización › Mapa de procesos

// Módulo: Admisión (enlazado desde el panel lateral)
const GuiaPostulante = lazy(() => import('../pages/admision/GuiaPostulante'));
const Resoluciones = lazy(() => import('../pages/admision/Resoluciones'));
const GestionFormacionPregrado = lazy(() => import('../pages/admision/GestionFormacionPregrado'));

// Fallback mientras llega el chunk de la ruta. Reserva alto para evitar saltos.
function RouteFallback() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center" role="status" aria-label="Cargando">
      <div className="w-10 h-10 rounded-full border-4 border-gray-200 border-t-primary animate-spin" />
    </div>
  );
}

export default function AppRouter() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ScrollToHash />
      <FloatingAdmissions />
      <div className="flex flex-col min-h-[100svh]">
        <Navbar />

        <main className="flex-grow">
          <Suspense fallback={<RouteFallback />}>
          <Routes>
            {/* Inicio */}
            <Route path="/" element={<Inicio />} />

            {/* ── Nosotros ── */}
            <Route path="/nosotros" element={<NosotrosIndex />}>
              <Route index element={<Historia />} />
              <Route path="historia" element={<Historia />} />
              <Route path="mision-vision" element={<MisionVision />} />
            </Route>

            {/* ── Organización ── */}
            <Route path="/organizacion" element={<OrganizacionIndex />}>
              <Route index element={<OrganizacionDireccion />} />
              <Route path="direccion" element={<OrganizacionDireccion />} />
              <Route path="organos-gobierno" element={<OrganosGobierno />} />
              <Route path="docentes" element={<Docentes />} />
              <Route path="administrativos" element={<Administrativos />} />
              <Route path="comites" element={<Comites />} />
              <Route path="estructura" element={<MapaProcesos />} />
            </Route>

            {/* ── Académico ── */}
            <Route path="/academico" element={<AcademicoIndex />}>
              {/* Índice = primera pestaña (Objetivos), igual que las demás secciones */}
              <Route index element={<Objetivos />} />
              {/* Formación (movida desde Nosotros) */}
              <Route path="objetivos" element={<Objetivos />} />
              <Route path="perfiles" element={<Perfiles />} />
              <Route path="malla-curricular" element={<PlanEstudios />} />
              <Route path="laboratorios" element={<Laboratorios />} />
              <Route path="responsabilidad-social" element={<EnConstruccion titulo="Responsabilidad **Social**" />} />
              <Route path="convenios" element={<Convenios />} />
              <Route path="movilidad" element={<Movilidad />} />
              {/* Ruta conservada (Titulación), fuera del menú */}
              <Route path="titulacion" element={<Titulacion />} />
            </Route>

            {/* ── Investigación ── */}
            <Route path="/investigacion" element={<InvestigacionIndex />}>
              <Route index element={<Lineas />} />
              <Route path="lineas" element={<Lineas />} />
              <Route path="publicaciones" element={<Publicaciones />} />
              <Route path="revistas" element={<Revistas />} />
              <Route path="proyectos" element={<ProyectosGrupo />} />
            </Route>

            {/* ── Admisión (panel lateral) ── */}
            <Route path="/admision/guia" element={<GuiaPostulante />} />
            <Route path="/admision/estadisticas" element={<Estadisticas />} />
            <Route path="/admision/resoluciones" element={<Resoluciones />} />
            <Route path="/admision/gestion-formacion-pregrado" element={<GestionFormacionPregrado />} />

            {/* Conservadas fuera del menú */}
            <Route path="/noticias" element={<Noticias />} />
            <Route path="/noticias/:id" element={<NoticiaDetalle />} />
            <Route path="/contacto" element={<Contacto />} />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </main>

        <Footer />
      </div>
    </BrowserRouter>
  );
}
