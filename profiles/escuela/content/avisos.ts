// Avisos institucionales de la barra superior (banner). Edita o vacía la lista.
// Si dejas el arreglo vacío ([]), el banner no se muestra.
//   - texto:  el aviso
//   - link:   destino al pulsar "Ver más" (ruta interna como '/noticias' o URL externa)
//   - externo: true si el link es una URL externa (abre en pestaña nueva)
export interface Aviso {
  id: number;
  texto: string;
  link: string;
  externo: boolean;
}

export const avisos: Aviso[] = [];
