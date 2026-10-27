// Forma: ver profiles/escuela/content/home.ts
// accesosRapidos usa íconos de lucide-react como `icono`.
import type { LucideIcon } from 'lucide-react';

export interface AccesoRapido {
  titulo: string;
  descripcion: string;
  icono: LucideIcon;
  link: string;
}
export const accesosRapidos: AccesoRapido[] = [];

export interface Ambiente {
  badge: string;
  titulo: string;
  descripcion: string;
  imagen: string;
  alt: string;
}
export const ambientes: Ambiente[] = [];
