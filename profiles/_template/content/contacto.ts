// Forma: ver profiles/escuela/content/contacto.ts
export const informacionContacto = {
  direccion: '',
  telefonos: [] as string[],
  correo: '',
  horarioAtencion: '',
  // URL "embed" de Google Maps (Compartir → Insertar un mapa → atributo src).
  mapaEmbedUrl: '',
  mapaTitulo: '',
};

export const redesSociales = {
  facebook: '',
  instagram: '',
  youtube: '',
  twitter: '',
};

export let libroReclamacionesUrl = '';

/** Lo llama el cargador remoto (src/data) para actualizar estos textos con los del panel. */
export function __aplicar(d: Partial<{ libroReclamacionesUrl: string }>): void {
  if (d.libroReclamacionesUrl !== undefined) libroReclamacionesUrl = d.libroReclamacionesUrl;
}
