import { useEffect } from 'react';
import { apiPublico } from '../lib/api';

/** Registra una visita anónima por sesión de navegador y sección (no bloquea; ignora errores). */
export function registrarVisita(seccion: string): void {
  const clave = `visita:${seccion}`;
  try {
    if (sessionStorage.getItem(clave)) return;
    sessionStorage.setItem(clave, '1');
  } catch {
    /* sessionStorage no disponible: se registra igual */
  }
  apiPublico.post('/visitas', { seccion }, { keepalive: true }).catch(() => undefined);
}

export function useRegistrarVisita(seccion: string): void {
  useEffect(() => {
    registrarVisita(seccion);
  }, [seccion]);
}
