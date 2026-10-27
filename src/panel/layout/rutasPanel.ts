/**
 * Registro de pantallas y menú del panel. ÚNICA fuente de verdad de rutas.
 *
 * CONVENCIÓN PARA LOS PAQUETES B12–B17 (no editan este archivo ni el router):
 *   1. Cree `src/panel/vistas/<vista>.tsx` con el nombre EXACTO de la columna
 *      `vista` y un `export default` del componente de página.
 *   2. Se descubre sola con `import.meta.glob` (carga perezosa, un chunk por
 *      vista). Mientras el archivo no exista se muestra "Pantalla en preparación".
 *   3. La ruta, los roles (RutaProtegida) y el ítem del menú ya están aquí.
 *      Los parámetros (`:id`, que puede ser `nueva`/`nuevo`) se leen con `useParams()`.
 *      Las pestañas se sincronizan con `?pestana=` (`usePestanaUrl`).
 */
import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import {
  BookOpen,
  ChartColumn,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Inbox,
  LayoutDashboard,
  Newspaper,
  UserCog,
  type LucideIcon,
} from 'lucide-react';
import { EDITORES, TODOS, type Rol } from '../modelos/comunes';

export interface RutaPanel {
  /** Ruta relativa a `/panel` ('' = índice). */
  ruta: string;
  /** Nombre del archivo en `src/panel/vistas/` (sin extensión). */
  vista: string;
  /** Título (placeholder y documento). */
  titulo: string;
  roles: readonly Rol[];
  /** Paquete responsable (informativo). */
  paquete: string;
}

const SOLO_REVISOR: readonly Rol[] = ['Revisor'];
const ADMIN_Y_REVISOR: readonly Rol[] = ['Administrador', 'Revisor'];

export const RUTAS_PANEL: readonly RutaPanel[] = [
  { ruta: '', vista: 'PaginaDashboard', titulo: 'Inicio', roles: TODOS, paquete: 'B17' },
  { ruta: 'revision', vista: 'PaginaBandejaRevision', titulo: 'Bandeja de revisión', roles: SOLO_REVISOR, paquete: 'B17' },
  { ruta: 'publicaciones', vista: 'PaginaPublicarContenido', titulo: 'Publicaciones', roles: EDITORES, paquete: 'B13' },
  { ruta: 'publicaciones/:id', vista: 'PaginaEditarPublicacion', titulo: 'Publicación', roles: EDITORES, paquete: 'B13' },
  { ruta: 'docentes', vista: 'PaginaGestionarDocentes', titulo: 'Docentes', roles: EDITORES, paquete: 'B14' },
  { ruta: 'docentes/:id', vista: 'PaginaEditarDocente', titulo: 'Docente', roles: EDITORES, paquete: 'B14' },
  { ruta: 'plan', vista: 'PaginaGestionarPlanEstudios', titulo: 'Plan de estudios', roles: EDITORES, paquete: 'B15' },
  { ruta: 'plan/:id', vista: 'PaginaEditarPlan', titulo: 'Versión del plan', roles: EDITORES, paquete: 'B15' },
  { ruta: 'documentos-admision', vista: 'PaginaGestionarDocumentosAdmision', titulo: 'Documentos y admisión', roles: EDITORES, paquete: 'B16' },
  { ruta: 'documentos/:id', vista: 'PaginaEditarDocumento', titulo: 'Documento oficial', roles: EDITORES, paquete: 'B16' },
  { ruta: 'campanas/:id', vista: 'PaginaEditarCampana', titulo: 'Campaña de admisión', roles: EDITORES, paquete: 'B16' },
  { ruta: 'consultas', vista: 'PaginaAtenderConsultas', titulo: 'Consultas', roles: EDITORES, paquete: 'B17' },
  { ruta: 'usuarios', vista: 'PaginaGestionarUsuarios', titulo: 'Usuarios', roles: ADMIN_Y_REVISOR, paquete: 'B12' },
  { ruta: 'estadisticas', vista: 'PaginaEstadisticas', titulo: 'Estadísticas', roles: TODOS, paquete: 'B17' },
];

/** Alias → destino canónico (nombres alternativos usados en el backlog). */
export const REDIRECCIONES_PANEL: Readonly<Record<string, string>> = {
  'plan-estudios': '/panel/plan',
  documentos: '/panel/documentos-admision?pestana=documentos',
  admision: '/panel/documentos-admision?pestana=admision',
  campanas: '/panel/documentos-admision?pestana=admision',
  bitacora: '/panel/usuarios?pestana=bitacora',
  solicitudes: '/panel/usuarios?pestana=solicitudes',
  departamentos: '/panel/docentes',
};

// ── Descubrimiento perezoso de vistas ───────────────────────────────────────

type ModuloVista = { default: ComponentType };

// Las vistas de autenticación las carga PanelApp por separado.
const modulos = import.meta.glob<ModuloVista>([
  '../vistas/Pagina*.tsx',
  '!../vistas/PaginaLogin.tsx',
  '!../vistas/PaginaCambiarContrasena.tsx',
  '!../vistas/PaginaRecuperar.tsx',
  '!../vistas/PaginaRestablecer.tsx',
  '!../vistas/PaginaNoAutorizado.tsx',
]);

const cache = new Map<string, LazyExoticComponent<ComponentType> | null>();

/** Componente perezoso de la vista o `null` si su archivo aún no existe. */
export function componenteVista(vista: string): LazyExoticComponent<ComponentType> | null {
  if (!cache.has(vista)) {
    const cargar = modulos[`../vistas/${vista}.tsx`];
    cache.set(vista, cargar ? lazy(cargar) : null);
  }
  return cache.get(vista) ?? null;
}

// ── Menú lateral (§6.3, matriz §3.3) ────────────────────────────────────────

export interface ItemMenu {
  etiqueta: string;
  a: string;
  icono: LucideIcon;
  roles: readonly Rol[];
  /** Coincidencia exacta (solo para el índice). */
  exacto?: boolean;
  /** Otros prefijos de URL que marcan el ítem como activo. */
  activoEn?: string[];
  /** Muestra el número de pendientes de revisión. */
  contador?: 'revision';
}

export const MENU_PANEL: readonly ItemMenu[] = [
  { etiqueta: 'Inicio', a: '/panel', icono: LayoutDashboard, roles: TODOS, exacto: true },
  { etiqueta: 'Bandeja de revisión', a: '/panel/revision', icono: ClipboardCheck, roles: SOLO_REVISOR, contador: 'revision' },
  { etiqueta: 'Publicaciones', a: '/panel/publicaciones', icono: Newspaper, roles: EDITORES },
  { etiqueta: 'Docentes', a: '/panel/docentes', icono: GraduationCap, roles: EDITORES },
  { etiqueta: 'Plan de estudios', a: '/panel/plan', icono: BookOpen, roles: EDITORES },
  {
    etiqueta: 'Documentos y admisión',
    a: '/panel/documentos-admision',
    icono: FileText,
    roles: EDITORES,
    activoEn: ['/panel/documentos/', '/panel/campanas/'],
  },
  { etiqueta: 'Consultas', a: '/panel/consultas', icono: Inbox, roles: EDITORES },
  { etiqueta: 'Usuarios', a: '/panel/usuarios', icono: UserCog, roles: ADMIN_Y_REVISOR },
  { etiqueta: 'Estadísticas', a: '/panel/estadisticas', icono: ChartColumn, roles: TODOS },
];

/** Clave TanStack Query del contador de la bandeja (B17 debe reutilizarla al invalidar). */
export const CLAVE_PENDIENTES_REVISION = ['panel', 'revision', 'pendientes'] as const;
