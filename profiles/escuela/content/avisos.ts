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

export const avisos: Aviso[] = [
  {
    id: 1,
    texto: 'Texto del primer aviso institucional. Reemplázalo por una novedad de tu programa.',
    link: '/noticias',
    externo: false,
  },
  {
    id: 2,
    texto: 'Texto del segundo aviso institucional. Reemplázalo por una novedad de tu programa.',
    link: '/noticias',
    externo: false,
  },
  {
    id: 3,
    texto: 'Texto del tercer aviso institucional. Reemplázalo por una novedad de tu programa.',
    link: '/noticias',
    externo: false,
  },
];
