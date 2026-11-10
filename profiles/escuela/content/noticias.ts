// Noticias y eventos institucionales — editar aquí para actualizar el feed
/** Una noticia tal como la usa el sitio. El panel la entrega con estos campos (contenido con formato sencillo: ver components/noticias/Prosa.tsx). */
export interface Noticia {
  id: number;
  categoria: string;
  categoriaColor: string;
  titulo: string;
  resumen: string;
  /** Cuerpo completo con formato: ## títulos, **negrita**, [enlaces](url), listas, > citas, ![imagen](url "pie"). */
  contenido?: string;
  fecha: string;
  fechaFormateada: string;
  link: string;
  imagen: string | null;
}

/** Respaldo si la API no responde: vacío a propósito (las noticias reales se administran desde el panel). */
export const noticias: Noticia[] = [];
