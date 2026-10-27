import type { Profile } from '@/profile-types';
import { site } from './config/site';
import { branding } from './config/branding';
import { seo } from './config/seo';

/**
 * Perfil activo por defecto de la plantilla (carpeta `escuela`).
 * Edita los archivos de `config/` y `content/` para tu escuela.
 */
const profile: Profile = { site, branding, seo };

export default profile;
