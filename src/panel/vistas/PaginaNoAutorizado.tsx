import { ShieldAlert } from 'lucide-react';
import { EncabezadoPagina } from '../componentes/EncabezadoPagina';
import { BotonEnlace } from '../componentes/Boton';
import { Vacio } from '../componentes/Estados';

/** Pantalla 403: el rol del usuario no permite esta sección (la usa RutaProtegida). */
export default function PaginaNoAutorizado() {
  return (
    <>
      <EncabezadoPagina titulo="Acceso no autorizado" />
      <div className="rounded-lg border border-gray-200 bg-white">
        <Vacio
          icono={<ShieldAlert className="h-10 w-10 text-danger" />}
          titulo="No tiene permiso para ver esta sección"
          descripcion="Su rol no incluye acceso a esta pantalla. Si cree que es un error, comuníquese con el Administrador del portal."
          accion={<BotonEnlace to="/panel">Ir al inicio del panel</BotonEnlace>}
        />
      </div>
    </>
  );
}
