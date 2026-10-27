import { useEffect, useId, useMemo, useRef, useState, type DragEvent, type ReactNode } from 'react';
import clsx from 'clsx';
import { FileText, UploadCloud, X } from 'lucide-react';
import type { ErrorCampo } from './Formulario';

export interface SubirArchivoProps {
  etiqueta: ReactNode;
  /** Tipos aceptados (atributo `accept`), p.ej. "image/jpeg,image/png,image/webp" o "application/pdf". */
  aceptar: string;
  /** Tamaño máximo en MB (validado en el cliente). */
  maxMB: number;
  /** Archivo seleccionado (controlado). */
  archivo: File | null;
  onSeleccionar: (archivo: File | null) => void;
  /** URL del archivo ya guardado en el servidor (se muestra si no hay uno nuevo). */
  urlActual?: string | null;
  /** Validación extra (p.ej. dimensiones mínimas). Devuelve un mensaje de error o null. */
  validar?: (archivo: File) => Promise<string | null> | string | null;
  error?: ErrorCampo;
  ayuda?: ReactNode;
  deshabilitado?: boolean;
  requerido?: boolean;
  className?: string;
}

function aceptaTipo(archivo: File, aceptar: string): boolean {
  const reglas = aceptar.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  if (!reglas.length) return true;
  const tipo = archivo.type.toLowerCase();
  const nombre = archivo.name.toLowerCase();
  return reglas.some((r) =>
    r.startsWith('.') ? nombre.endsWith(r) : r.endsWith('/*') ? tipo.startsWith(r.slice(0, -1)) : tipo === r,
  );
}

const formatoMB = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(bytes < 1024 * 1024 ? 2 : 1)} MB`;

/**
 * Selector de archivo con arrastrar y soltar, validación de tipo/tamaño en el
 * cliente y vista previa (imágenes) o nombre (PDF). Accesible con teclado:
 * el control real es un `<input type=file>` visible para lectores.
 */
export function SubirArchivo({
  etiqueta,
  aceptar,
  maxMB,
  archivo,
  onSeleccionar,
  urlActual,
  validar,
  error,
  ayuda,
  deshabilitado,
  requerido,
  className,
}: SubirArchivoProps) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [arrastrando, setArrastrando] = useState(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const esImagen = aceptar.includes('image');

  // Vista previa local de la imagen elegida (la URL se libera al cambiarla).
  const vista = useMemo(
    () => (archivo && archivo.type.startsWith('image/') ? URL.createObjectURL(archivo) : null),
    [archivo],
  );
  useEffect(
    () => () => {
      if (vista) URL.revokeObjectURL(vista);
    },
    [vista],
  );

  const elegir = async (f: File | undefined) => {
    setErrorLocal(null);
    if (!f) return;
    if (!aceptaTipo(f, aceptar)) {
      setErrorLocal('El tipo de archivo no está permitido.');
      return;
    }
    if (f.size > maxMB * 1024 * 1024) {
      setErrorLocal(`El archivo pesa ${formatoMB(f.size)}; el máximo es ${maxMB} MB.`);
      return;
    }
    if (validar) {
      const msg = await validar(f);
      if (msg) {
        setErrorLocal(msg);
        return;
      }
    }
    onSeleccionar(f);
  };

  const alSoltar = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setArrastrando(false);
    if (!deshabilitado) void elegir(e.dataTransfer.files?.[0]);
  };

  const msg = errorLocal ?? (Array.isArray(error) ? error[0] : error) ?? null;
  const previa = vista ?? (esImagen ? urlActual : null);

  return (
    <div className={clsx('space-y-1.5', className)}>
      <label htmlFor={id} className="block text-sm font-semibold text-ink">
        {etiqueta}
        {requerido && (
          <span className="ml-0.5 text-danger" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!deshabilitado) setArrastrando(true);
        }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={alSoltar}
        className={clsx(
          'flex flex-col items-center gap-3 rounded-lg border-2 border-dashed px-4 py-5 text-center transition-colors sm:flex-row sm:text-left',
          arrastrando ? 'border-primary bg-primary/5' : msg ? 'border-danger/60 bg-red-50/40' : 'border-gray-300 bg-white',
          deshabilitado && 'opacity-60',
        )}
      >
        {previa ? (
          <img src={previa} alt="Vista previa" className="h-20 w-28 shrink-0 rounded-md border border-gray-200 object-cover" />
        ) : archivo || urlActual ? (
          <FileText aria-hidden="true" className="h-10 w-10 shrink-0 text-primary" />
        ) : (
          <UploadCloud aria-hidden="true" className="h-10 w-10 shrink-0 text-gray-400" />
        )}
        <div className="min-w-0 flex-1 text-sm">
          {archivo ? (
            <p className="truncate font-medium text-ink">
              {archivo.name} <span className="text-gray-500">({formatoMB(archivo.size)})</span>
            </p>
          ) : urlActual ? (
            <a href={urlActual} target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline">
              Ver archivo actual
            </a>
          ) : (
            <p className="text-gray-600">Arrastre el archivo aquí o selecciónelo.</p>
          )}
          <p className="mt-0.5 text-xs text-gray-500">{ayuda ?? `Máximo ${maxMB} MB.`}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <input
            ref={input}
            id={id}
            type="file"
            accept={aceptar}
            disabled={deshabilitado}
            className="sr-only"
            aria-invalid={msg ? true : undefined}
            aria-describedby={msg ? `${id}-error` : undefined}
            onChange={(e) => {
              void elegir(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            disabled={deshabilitado}
            onClick={() => input.current?.click()}
            className="inline-flex h-9 items-center rounded-md border border-gray-300 bg-white px-3 text-sm font-semibold text-ink hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:cursor-not-allowed"
          >
            {archivo || urlActual ? 'Cambiar' : 'Seleccionar'}
          </button>
          {archivo && !deshabilitado && (
            <button
              type="button"
              onClick={() => onSeleccionar(null)}
              aria-label="Quitar archivo seleccionado"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-danger focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      {msg && (
        <p id={`${id}-error`} role="alert" className="text-xs font-medium text-danger">
          {msg}
        </p>
      )}
    </div>
  );
}

/** Lee las dimensiones de una imagen en el cliente (para validar mínimos antes de subir). */
export function dimensionesImagen(archivo: File): Promise<{ ancho: number; alto: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(archivo);
    const img = new Image();
    img.onload = () => {
      resolve({ ancho: img.naturalWidth, alto: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo leer la imagen.'));
    };
    img.src = url;
  });
}

export default SubirArchivo;
