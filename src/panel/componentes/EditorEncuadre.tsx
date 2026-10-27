import { useId, useRef, type PointerEvent } from 'react';
import clsx from 'clsx';
import { Move } from 'lucide-react';
import DocenteCard from '../../components/personas/DocenteCard';
import { posicionFoto } from '../modelos/docentes';

export interface EncuadreXY {
  x: number;
  y: number;
}

export interface DatosTarjetaDocente {
  grado: string;
  nombre: string;
  cursoPrincipal: string;
  especialidades: string[];
  investigador: boolean;
  categoriaInvestigacion: string | null;
  condicion: string | null;
}

interface Props {
  /** URL de la foto (servidor o `blob:` de la foto recién elegida). */
  fotoUrl: string | null;
  encuadre: EncuadreXY;
  onCambiar: (e: EncuadreXY) => void;
  /** Datos para la vista previa de la tarjeta real del sitio. */
  tarjeta: DatosTarjetaDocente;
  deshabilitado?: boolean;
  className?: string;
}

const limitar = (n: number) => Math.min(100, Math.max(0, Math.round(n)));

/**
 * Fija el encuadre (`encuadre_x`, `encuadre_y`, 0–100) de la foto de un docente.
 * Se puede arrastrar el punto de enfoque sobre la foto o usar los deslizadores
 * (teclado y lectores de pantalla). La vista previa es la `DocenteCard` pública,
 * que aplica `object-position: x% y%` igual que el sitio.
 */
export default function EditorEncuadre({ fotoUrl, encuadre, onCambiar, tarjeta, deshabilitado, className }: Props) {
  const id = useId();
  const marco = useRef<HTMLDivElement>(null);
  const arrastrando = useRef(false);

  const desdePuntero = (e: PointerEvent<HTMLDivElement>) => {
    const r = marco.current?.getBoundingClientRect();
    if (!r || !r.width || !r.height) return;
    onCambiar({ x: limitar(((e.clientX - r.left) / r.width) * 100), y: limitar(((e.clientY - r.top) / r.height) * 100) });
  };

  return (
    <div className={clsx('grid gap-6 sm:grid-cols-2', className)}>
      <div className="space-y-4">
        <div>
          <p className="mb-1 text-sm font-semibold text-ink" id={`${id}-t`}>
            Punto de enfoque
          </p>
          {fotoUrl ? (
            <div
              ref={marco}
              role="presentation"
              onPointerDown={(e) => {
                if (deshabilitado) return;
                arrastrando.current = true;
                e.currentTarget.setPointerCapture(e.pointerId);
                desdePuntero(e);
              }}
              onPointerMove={(e) => arrastrando.current && desdePuntero(e)}
              onPointerUp={() => (arrastrando.current = false)}
              onPointerCancel={() => (arrastrando.current = false)}
              className={clsx(
                'relative max-h-72 w-full select-none overflow-hidden rounded-md border border-gray-300 bg-gray-100 touch-none',
                !deshabilitado && 'cursor-crosshair',
              )}
            >
              <img src={fotoUrl} alt="Foto completa del docente" draggable={false} className="block max-h-72 w-full object-contain" />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-primary/80 text-white shadow"
                style={{ left: `${encuadre.x}%`, top: `${encuadre.y}%` }}
              >
                <Move className="h-4 w-4" />
              </span>
            </div>
          ) : (
            <p className="rounded-md border border-dashed border-gray-300 p-4 text-sm text-gray-600">
              Seleccione una foto para ajustar su encuadre.
            </p>
          )}
          <p className="mt-1 text-xs text-gray-600">Haga clic o arrastre sobre la foto, o use los deslizadores.</p>
        </div>

        {(['x', 'y'] as const).map((eje) => (
          <div key={eje}>
            <label htmlFor={`${id}-${eje}`} className="mb-1 flex justify-between text-sm font-semibold text-ink">
              <span>{eje === 'x' ? 'Horizontal (encuadre_x)' : 'Vertical (encuadre_y)'}</span>
              <span className="tabular-nums text-gray-600">{encuadre[eje]}%</span>
            </label>
            <input
              id={`${id}-${eje}`}
              type="range"
              min={0}
              max={100}
              step={1}
              disabled={deshabilitado || !fotoUrl}
              value={encuadre[eje]}
              aria-valuetext={`${encuadre[eje]} por ciento`}
              onChange={(e) => onCambiar({ ...encuadre, [eje]: limitar(Number(e.target.value)) })}
              className="w-full accent-primary disabled:opacity-50"
            />
          </div>
        ))}
      </div>

      <div>
        <p className="mb-1 text-sm font-semibold text-ink">Vista previa en el sitio</p>
        <div className="mx-auto max-w-[260px]">
          <DocenteCard
            docente={{
              ...tarjeta,
              foto: fotoUrl,
              fotoPosicion: posicionFoto(encuadre.x, encuadre.y),
            }}
          />
        </div>
        <p className="mt-2 text-xs text-gray-600">Pase el cursor o enfoque la tarjeta para ver el reverso.</p>
      </div>
    </div>
  );
}
