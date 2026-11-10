// Personal administrativo de la escuela. Se administra desde el panel (Organización → Administrativos);
// este archivo es el respaldo. Sin personas cargadas, la página muestra «En construcción».
export interface Administrativo {
  nombre: string;
  /** Técnico administrativo, Técnico de laboratorio, etc. */
  cargo: string;
  /** Dependencia o área donde labora. */
  area: string;
  foto?: string | null;
  /** Encuadre de la foto, p. ej. '50% 20%'. */
  fotoPosicion?: string;
}

export const administrativos: Administrativo[] = [];
