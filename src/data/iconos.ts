import {
  Award, BookOpen, Briefcase, Building2, Calendar, ClipboardList, Code, Cpu, Database, FileText, FlaskConical,
  GraduationCap, Globe, Handshake, Laptop, Library, Lightbulb, Mail, MapPin, Microscope, Network, Newspaper,
  Phone, Rocket, School, ShieldCheck, Star, Trophy, UserCheck, Users,
  type LucideIcon,
} from 'lucide-react';

/**
 * Íconos que el panel permite elegir para los accesos rápidos. Lista cerrada a propósito:
 * importar todo lucide-react inflaría el sitio. Debe coincidir con el `enum` de `icono`
 * en el esquema «home» del backend (informatica-back/internal/content/schemas/home.json).
 */
export const ICONOS: Record<string, LucideIcon> = {
  Award, BookOpen, Briefcase, Building2, Calendar, ClipboardList, Code, Cpu, Database, FileText, FlaskConical,
  GraduationCap, Globe, Handshake, Laptop, Library, Lightbulb, Mail, MapPin, Microscope, Network, Newspaper,
  Phone, Rocket, School, ShieldCheck, Star, Trophy, UserCheck, Users,
};

export const NOMBRES_ICONOS = Object.keys(ICONOS);
