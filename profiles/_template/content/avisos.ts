// Forma: ver profiles/escuela/content/avisos.ts
// Avisos de la barra superior (banner). Si dejas la lista vacía, no se muestra.
export interface Aviso {
  id: number;
  texto: string;
  link: string;
  externo: boolean;
}

export const avisos: Aviso[] = [];
