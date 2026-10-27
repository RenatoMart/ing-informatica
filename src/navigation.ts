/**
 * Navegación (sistema): helpers de recorrido sobre los datos del perfil activo.
 *
 * Los datos (NAV_LINKS, ADMISION_GROUPS) viven en el perfil
 * (`@profile/config/navigation`, Configuración). Los tipos están en el contrato
 * (`profile-types`) y los helpers aquí. Importar SIEMPRE desde `@/navigation`.
 */
import { NAV_LINKS, ADMISION_GROUPS } from '@profile/config/navigation';
import type { NavLeaf, NavGroup, NavSection } from './profile-types';

export type { NavLeaf, NavGroup, NavSection };
export { NAV_LINKS, ADMISION_GROUPS };

/** Devuelve la entrada de sección (con sus grupos) a partir de su ruta base. */
export const getSection = (basePath: string): NavSection | undefined =>
  NAV_LINKS.find((link) => link.path === basePath);

/** Aplana los grupos de una sección a su lista de items (1 item = 1 página/pestaña). */
export const flattenItems = (groups: NavGroup[] = []): NavLeaf[] =>
  groups.flatMap((group) => group.items);

/**
 * Items internos (navegables dentro del sitio) de una sección, deduplicados por
 * página. Excluye externos. Lo usan SectionTabs (1 pestaña por página) y las
 * rutas anidadas.
 */
export const getInternalItems = (section: NavSection | undefined): NavLeaf[] =>
  flattenItems(section?.groups).filter((item) => !item.external);

/**
 * Enlaces granulares para el Navbar: expande `navAs` en varias etiquetas finas.
 * Si un item no tiene `navAs`, se muestra tal cual.
 */
export const expandNavLinks = (items: NavLeaf[] = []): NavLeaf[] =>
  items.flatMap((item) => item.navAs ?? [item]);
