import { Construction } from 'lucide-react';
import { EncabezadoPagina } from '../componentes/EncabezadoPagina';
import { Vacio } from '../componentes/Estados';

/** Placeholder de una ruta cuya vista (`vistas/<vista>.tsx`) aún no existe. */
export function PantallaPendiente({ titulo, vista }: { titulo: string; vista: string }) {
  return (
    <>
      <EncabezadoPagina titulo={titulo} />
      <div className="rounded-lg border border-dashed border-gray-300 bg-white">
        <Vacio
          icono={<Construction className="h-9 w-9 text-gold-deep" />}
          titulo="Pantalla en preparación"
          descripcion={
            <>
              Esta sección del panel estará disponible próximamente.
              {import.meta.env.DEV && (
                <span className="mt-2 block font-mono text-xs text-gray-500">src/panel/vistas/{vista}.tsx</span>
              )}
            </>
          }
        />
      </div>
    </>
  );
}

export default PantallaPendiente;
