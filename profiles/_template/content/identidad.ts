// Forma: ver profiles/escuela/content/identidad.ts
export let mision = '';
export let vision = '';
export const valores: { nombre: string; descripcion: string }[] = [];
export const historia = {
  fundacion: 0,
  resena: '',
  hitos: [] as { año: number; descripcion: string }[],
};

/** Lo llama el cargador remoto (src/data) para actualizar estos textos con los del panel. */
export function __aplicar(d: Partial<{ mision: string; vision: string }>): void {
  if (d.mision !== undefined) mision = d.mision;
  if (d.vision !== undefined) vision = d.vision;
}
