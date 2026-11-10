import { BookOpen, Users, FlaskConical, GraduationCap, Handshake, UserCheck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// Contenido de la página de Inicio (accesos rápidos + ambientes destacados).

export interface AccesoRapido {
  titulo: string;
  descripcion: string;
  icono: LucideIcon;
  link: string;
}

export const accesosRapidos: AccesoRapido[] = [
  { titulo: 'Perfiles Académicos', descripcion: 'Perfil de ingreso y de egreso del programa.', icono: UserCheck, link: '/academico/perfiles' },
  { titulo: 'Plan de Estudios', descripcion: 'Malla curricular actualizada por ciclos.', icono: BookOpen, link: '/academico/malla-curricular' },
  { titulo: 'Plana Docente', descripcion: 'Profesores e investigadores comprometidos.', icono: Users, link: '/organizacion/docentes' },
  { titulo: 'Investigación', descripcion: 'Líneas, proyectos y publicaciones activas.', icono: FlaskConical, link: '/investigacion/proyectos' },
  { titulo: 'Grados y Títulos', descripcion: 'Pasos y requisitos para tu titulación.', icono: GraduationCap, link: '/academico/titulacion' },
  { titulo: 'Convenios', descripcion: 'Alianzas con instituciones y empresas aliadas.', icono: Handshake, link: '/academico/convenios' },
];

export interface Ambiente {
  badge: string;
  titulo: string;
  descripcion: string;
  imagen: string;
  alt: string;
}

export const ambientes: Ambiente[] = [
  {
    badge: 'Ambiente',
    titulo: 'Laboratorios',
    descripcion:
      'Espacios equipados con computadoras donde se desarrollan las prácticas de las experiencias curriculares teórico-práctico-laboratorio de la formación en Informática.',
    imagen: 'https://picsum.photos/seed/laboratorios/800/600',
    alt: 'Laboratorios de la Escuela de Informática',
  },
];
