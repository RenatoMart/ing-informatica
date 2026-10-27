/**
 * Cliente HTTP común del panel y del sitio público (contrato: docs/DISENO_BACKEND.md §5).
 *
 * - Mismo origen: `credentials: 'same-origin'` + cookie de sesión de Laravel.
 * - CSRF: lee la cookie `XSRF-TOKEN` y la envía en `X-XSRF-TOKEN`. Si la cookie
 *   aún no existe, la obtiene con `GET /api/panel/auth/yo`. Ante un 419 la renueva
 *   y reintenta la petición una sola vez.
 * - Errores: toda respuesta no-2xx (o fallo de red) se lanza como `ApiError`
 *   con el formato §5.1 `{ status, codigo, mensaje, campos }`.
 * - 401: avisa al manejador registrado con `configurarApi` (el panel limpia la
 *   sesión en memoria y su router redirige a `/panel/login`).
 *
 * Uso:
 *   apiPanel.get<Paginado<Fila>>('/publicaciones', { params: { pagina: 2 } })
 *   apiPanel.post<RespuestaDatos<{ id_publicacion: number }>>('/publicaciones', cuerpo)
 *   apiPanel.subir('/docentes/5/foto', { foto: archivo, encuadre_x: 50 })
 *   apiPublico.get<Paginado<Noticia>>('/publicaciones', { params: { por_pagina: 3 } })
 *   const datos = await soloDatos(apiPublico.get<RespuestaDatos<T>>('/admision'))
 */

export const BASE_PANEL = '/api/panel';
export const BASE_PUBLICO = '/api/publico';

/** Errores por campo, como en `error.campos` de §5.1. */
export type ErroresCampos = Record<string, string[]>;

export class ApiError extends Error {
  /** Código HTTP (0 = sin conexión / respuesta ilegible). */
  readonly status: number;
  /** Código de dominio (§5.1): VALIDACION, NO_AUTENTICADO, ESTADO_INVALIDO, RED, … */
  readonly codigo: string;
  /** Mensaje en español apto para mostrar al usuario. */
  readonly mensaje: string;
  /** Errores por campo (vacío si no aplica). */
  readonly campos: ErroresCampos;

  constructor(status: number, codigo: string, mensaje: string, campos: ErroresCampos = {}) {
    super(mensaje);
    this.name = 'ApiError';
    this.status = status;
    this.codigo = codigo;
    this.mensaje = mensaje;
    this.campos = campos;
  }

  /** Primer mensaje de error del campo indicado (o undefined). */
  campo(nombre: string): string | undefined {
    return this.campos[nombre]?.[0];
  }

  get esValidacion(): boolean {
    return this.status === 422;
  }

  get esRed(): boolean {
    return this.status === 0;
  }
}

export function esApiError(e: unknown): e is ApiError {
  return e instanceof ApiError;
}

/** Mensaje legible de cualquier error (para toasts y estados de error). */
export function mensajeDeError(e: unknown, porDefecto = 'Ocurrió un error inesperado.'): string {
  if (esApiError(e)) return e.mensaje;
  if (e instanceof Error && e.message) return e.message;
  return porDefecto;
}

/** Errores por campo de cualquier error (vacío si no es un 422). */
export function erroresDeCampos(e: unknown): ErroresCampos {
  return esApiError(e) ? e.campos : {};
}

// ── Manejadores globales ────────────────────────────────────────────────────

interface ManejadoresApi {
  /** Se llama ante cualquier 401 (salvo `silenciar401`). */
  alNoAutenticado?: (error: ApiError) => void;
  /** Se llama ante 403 CAMBIO_CONTRASENA_REQUERIDO. */
  alCambioContrasenaRequerido?: (error: ApiError) => void;
}

const RUTAS_INVITADO_PANEL = ['/panel/login', '/panel/recuperar', '/panel/restablecer'];

const manejadoresPorDefecto: Required<ManejadoresApi> = {
  // Fuera del SesionProvider (no debería ocurrir): recarga hacia el login si
  // estamos en una ruta protegida del panel.
  alNoAutenticado: () => {
    const ruta = window.location.pathname;
    if (ruta.startsWith('/panel') && !RUTAS_INVITADO_PANEL.some((r) => ruta.startsWith(r))) {
      const volver = encodeURIComponent(ruta + window.location.search);
      window.location.assign(`/panel/login?volver=${volver}`);
    }
  },
  alCambioContrasenaRequerido: () => {
    if (window.location.pathname !== '/panel/cambiar-contrasena') {
      window.location.assign('/panel/cambiar-contrasena');
    }
  },
};

let manejadores: Required<ManejadoresApi> = { ...manejadoresPorDefecto };

/** Registra manejadores globales. Devuelve una función que restaura los anteriores. */
export function configurarApi(nuevos: ManejadoresApi): () => void {
  const anteriores = manejadores;
  manejadores = { ...manejadores, ...nuevos };
  return () => {
    manejadores = anteriores;
  };
}

// ── CSRF ────────────────────────────────────────────────────────────────────

function leerCookie(nombre: string): string | null {
  const par = document.cookie.split('; ').find((c) => c.startsWith(`${nombre}=`));
  if (!par) return null;
  try {
    return decodeURIComponent(par.slice(nombre.length + 1));
  } catch {
    return null;
  }
}

let csrfEnCurso: Promise<void> | null = null;

/**
 * Garantiza que exista la cookie `XSRF-TOKEN`. Con `forzar` la renueva aunque
 * exista (tras un 419). Las peticiones concurrentes comparten la misma promesa.
 */
export function asegurarCsrf(forzar = false): Promise<void> {
  if (!forzar && leerCookie('XSRF-TOKEN')) return Promise.resolve();
  if (!csrfEnCurso) {
    csrfEnCurso = fetch(`${BASE_PANEL}/auth/yo`, {
      method: 'GET',
      credentials: 'same-origin',
      headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
    })
      .then(() => undefined)
      .catch(() => undefined)
      .finally(() => {
        csrfEnCurso = null;
      });
  }
  return csrfEnCurso;
}

// ── Petición base ───────────────────────────────────────────────────────────

export type ValorParam = string | number | boolean | null | undefined;
export type Metodo = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface OpcionesPeticion {
  /** Query string; se omiten los valores `null`, `undefined` y `''`. Los booleanos van como 1/0. */
  params?: Record<string, ValorParam>;
  signal?: AbortSignal;
  /** No invocar el manejador global de 401 (p.ej. al consultar `auth/yo`). */
  silenciar401?: boolean;
  /** Cabeceras extra. */
  headers?: Record<string, string>;
  /** Para `fetch(..., { keepalive })` (registro de visitas). */
  keepalive?: boolean;
}

function construirUrl(ruta: string, params?: Record<string, ValorParam>): string {
  if (!params) return ruta;
  const qs = new URLSearchParams();
  for (const [clave, valor] of Object.entries(params)) {
    if (valor === null || valor === undefined || valor === '') continue;
    qs.append(clave, typeof valor === 'boolean' ? (valor ? '1' : '0') : String(valor));
  }
  const texto = qs.toString();
  if (!texto) return ruta;
  return ruta + (ruta.includes('?') ? '&' : '?') + texto;
}

const MENSAJES_POR_STATUS: Record<number, [string, string]> = {
  400: ['SOLICITUD_INVALIDA', 'La solicitud no es válida.'],
  401: ['NO_AUTENTICADO', 'Su sesión ha finalizado. Inicie sesión nuevamente.'],
  403: ['ROL_NO_AUTORIZADO', 'No tiene permiso para realizar esta acción.'],
  404: ['NO_ENCONTRADO', 'El recurso solicitado no existe.'],
  409: ['ESTADO_INVALIDO', 'La acción no es posible en el estado actual del registro.'],
  413: ['ARCHIVO_DEMASIADO_GRANDE', 'El archivo supera el tamaño máximo permitido.'],
  419: ['CSRF_VENCIDO', 'La página ha expirado. Recárguela e intente de nuevo.'],
  422: ['VALIDACION', 'Revise los campos marcados.'],
  429: ['DEMASIADOS_INTENTOS', 'Demasiados intentos. Espere un momento e intente de nuevo.'],
};

interface CuerpoError {
  error?: { codigo?: string; mensaje?: string; campos?: ErroresCampos };
  message?: string;
  errors?: ErroresCampos;
}

async function normalizarError(resp: Response): Promise<ApiError> {
  let cuerpo: CuerpoError | null = null;
  try {
    if ((resp.headers.get('content-type') ?? '').includes('json')) {
      cuerpo = (await resp.json()) as CuerpoError;
    }
  } catch {
    cuerpo = null;
  }
  const [codigoDef, mensajeDef] =
    MENSAJES_POR_STATUS[resp.status] ??
    (resp.status >= 500
      ? ['ERROR_SERVIDOR', 'El servidor no pudo completar la operación. Intente más tarde.']
      : ['ERROR', 'Ocurrió un error inesperado.']);

  if (cuerpo?.error) {
    return new ApiError(
      resp.status,
      cuerpo.error.codigo ?? codigoDef,
      cuerpo.error.mensaje ?? mensajeDef,
      cuerpo.error.campos ?? {},
    );
  }
  // Respaldo: formato por defecto de Laravel `{ message, errors }`.
  return new ApiError(resp.status, codigoDef, mensajeDef, cuerpo?.errors ?? {});
}

async function peticion<T>(
  metodo: Metodo,
  ruta: string,
  cuerpo: BodyInit | object | undefined,
  opciones: OpcionesPeticion = {},
  reintentado = false,
): Promise<T> {
  const esFormData = typeof FormData !== 'undefined' && cuerpo instanceof FormData;
  const mutante = metodo !== 'GET';
  if (mutante) await asegurarCsrf();

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    ...opciones.headers,
  };
  if (cuerpo !== undefined && !esFormData) headers['Content-Type'] = 'application/json';
  const xsrf = leerCookie('XSRF-TOKEN');
  if (xsrf) headers['X-XSRF-TOKEN'] = xsrf;

  let resp: Response;
  try {
    resp = await fetch(construirUrl(ruta, opciones.params), {
      method: metodo,
      credentials: 'same-origin',
      headers,
      body:
        cuerpo === undefined ? undefined : esFormData ? (cuerpo as FormData) : JSON.stringify(cuerpo),
      signal: opciones.signal,
      keepalive: opciones.keepalive,
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') throw e;
    throw new ApiError(0, 'RED', 'No se pudo conectar con el servidor. Revise su conexión.');
  }

  if (resp.ok) {
    if (resp.status === 204) return undefined as T;
    const texto = await resp.text();
    if (!texto) return undefined as T;
    try {
      return JSON.parse(texto) as T;
    } catch {
      return texto as unknown as T;
    }
  }

  // 419: CSRF vencido → renovar cookie y reintentar una sola vez.
  if (resp.status === 419 && !reintentado) {
    await asegurarCsrf(true);
    return peticion<T>(metodo, ruta, cuerpo, opciones, true);
  }

  const error = await normalizarError(resp);
  if (error.status === 401 && !opciones.silenciar401) manejadores.alNoAutenticado(error);
  if (error.status === 403 && error.codigo === 'CAMBIO_CONTRASENA_REQUERIDO') {
    manejadores.alCambioContrasenaRequerido(error);
  }
  throw error;
}

// ── Multipart ───────────────────────────────────────────────────────────────

export type ValorFormulario = Blob | string | number | boolean | null | undefined;

/** Convierte un objeto plano a FormData (los arrays se envían como `clave[]`). */
export function aFormData(datos: Record<string, ValorFormulario | ValorFormulario[]>): FormData {
  const fd = new FormData();
  const agregar = (clave: string, valor: ValorFormulario) => {
    if (valor === null || valor === undefined) return;
    if (valor instanceof Blob) fd.append(clave, valor);
    else if (typeof valor === 'boolean') fd.append(clave, valor ? '1' : '0');
    else fd.append(clave, String(valor));
  };
  for (const [clave, valor] of Object.entries(datos)) {
    if (Array.isArray(valor)) valor.forEach((v) => agregar(`${clave}[]`, v));
    else agregar(clave, valor);
  }
  return fd;
}

// ── Cliente ─────────────────────────────────────────────────────────────────

export interface ClienteApi {
  get<T>(ruta: string, opciones?: OpcionesPeticion): Promise<T>;
  post<T = void>(ruta: string, cuerpo?: object, opciones?: OpcionesPeticion): Promise<T>;
  put<T = void>(ruta: string, cuerpo?: object, opciones?: OpcionesPeticion): Promise<T>;
  patch<T = void>(ruta: string, cuerpo?: object, opciones?: OpcionesPeticion): Promise<T>;
  delete<T = void>(ruta: string, opciones?: OpcionesPeticion): Promise<T>;
  /**
   * Subida multipart. `metodo` PUT/PATCH se envía como POST + `_method`
   * (PHP no parsea multipart en PUT).
   */
  subir<T = void>(
    ruta: string,
    datos: FormData | Record<string, ValorFormulario | ValorFormulario[]>,
    opciones?: OpcionesPeticion & { metodo?: 'POST' | 'PUT' | 'PATCH' },
  ): Promise<T>;
}

/** Crea un cliente cuyas rutas son relativas a `base`. */
export function crearCliente(base: string): ClienteApi {
  const url = (ruta: string) => (ruta.startsWith('/api/') ? ruta : base + ruta);
  return {
    get: (ruta, opciones) => peticion('GET', url(ruta), undefined, opciones),
    post: (ruta, cuerpo, opciones) => peticion('POST', url(ruta), cuerpo ?? {}, opciones),
    put: (ruta, cuerpo, opciones) => peticion('PUT', url(ruta), cuerpo ?? {}, opciones),
    patch: (ruta, cuerpo, opciones) => peticion('PATCH', url(ruta), cuerpo ?? {}, opciones),
    delete: (ruta, opciones) => peticion('DELETE', url(ruta), undefined, opciones),
    subir: (ruta, datos, opciones = {}) => {
      const fd = datos instanceof FormData ? datos : aFormData(datos);
      const metodo = opciones.metodo ?? 'POST';
      if (metodo !== 'POST') fd.set('_method', metodo);
      return peticion('POST', url(ruta), fd, opciones);
    },
  };
}

/** Rutas absolutas (`/api/...`). */
export const api = crearCliente('');
/** Rutas relativas a `/api/panel` (sesión + CSRF). */
export const apiPanel = crearCliente(BASE_PANEL);
/** Rutas relativas a `/api/publico` (sin autenticación). */
export const apiPublico = crearCliente(BASE_PUBLICO);

/** Desenvuelve `{ data }` de una respuesta §5.1. */
export async function soloDatos<T>(promesa: Promise<{ data: T }>): Promise<T> {
  return (await promesa).data;
}
