import type { Profile } from '@/profile-types';
import { site } from './config/site';
import { branding } from './config/branding';
import { seo } from './config/seo';

// Perfil en blanco. Copia esta carpeta a profiles/<slug-escuela>/ para empezar.
const profile: Profile = { site, branding, seo };

export default profile;
