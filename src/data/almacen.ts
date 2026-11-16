/**
 * Avisos de cambio del contenido del sitio, por sección («clave» de la API: contacto, noticias, malla…).
 *
 * Los datos viven en los módulos de `profiles/` y se reemplazan en sitio (ver hidratar.ts). Este archivo solo
 * lleva la cuenta de QUÉ sección cambió, para que React vuelva a pintar sin desmontar la página: se conserva
 * el estado de cada componente (menús abiertos, formularios, posición) y React solo toca lo que es distinto.
 */
import { useSyncExternalStore } from 'react';

const versiones = new Map<string, number>();
let total = 0;
const oyentes = new Set<() => void>();
let avisoPendiente = false;

/** Lo llama hidratar.ts cuando una sección recibe datos DISTINTOS a los que ya tenía. */
export function marcarCambio(clave: string): void {
  versiones.set(clave, (versiones.get(clave) ?? 0) + 1);
  total += 1;
  if (avisoPendiente) return;
  // Un solo aviso aunque cambien varias secciones a la vez (el perfil completo llega de golpe).
  avisoPendiente = true;
  queueMicrotask(() => {
    avisoPendiente = false;
    oyentes.forEach((f) => f());
  });
}

const suscribir = (f: () => void) => {
  oyentes.add(f);
  return () => { oyentes.delete(f); };
};

/**
 * Suscribe el componente a una o varias secciones y devuelve su número de versión (sube con cada cambio).
 * Sin argumentos se suscribe a todo. Úsalo como dependencia de `useMemo`/`useEffect` o como `key` de un
 * componente que guarda estado derivado de esos datos.
 */
export function useContenido(...claves: string[]): number {
  return useSyncExternalStore(suscribir, () =>
    claves.length === 0 ? total : claves.reduce((t, c) => t + (versiones.get(c) ?? 0), 0));
}
