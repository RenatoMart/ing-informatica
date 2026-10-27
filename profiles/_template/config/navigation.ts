import type { NavSection, NavGroup } from '@/profile-types';

// Estructura de navegación. Las rutas (`path`) deben coincidir con el router
// del sistema (src/router). Cambiar etiquetas es seguro.
// Ejemplo completo: profiles/escuela/config/navigation.ts
export const NAV_LINKS: NavSection[] = [
  { name: 'Inicio', path: '/' },
  { name: 'Contacto', path: '/contacto' },
];

export const ADMISION_GROUPS: NavGroup[] = [];
