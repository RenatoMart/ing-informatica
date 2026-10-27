import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MarcoAutenticacion } from '../layout/MarcoAutenticacion';
import { Boton } from '../componentes/Boton';
import { Formulario, combinarErrores } from '../componentes/Formulario';
import { CampoContrasena, ReglasContrasena } from '../componentes/CampoContrasena';
import { useToast } from '../componentes/Toast';
import { erroresDeCampos } from '../../lib/api';
import {
  REGLAS_CONTRASENA,
  useAutenticacionController,
  validarNuevaContrasena,
} from '../controladores/AutenticacionController';

/** `/panel/cambiar-contrasena` (cualquier usuario; obligatorio si `debe_cambiar_contrasena`). */
export default function PaginaCambiarContrasena() {
  const { sesion, estado, errores, acciones } = useAutenticacionController();
  const toast = useToast();
  const navegar = useNavigate();
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [local, setLocal] = useState<Record<string, string>>({});
  const obligatorio = sesion.debeCambiarContrasena;

  const enviar = async () => {
    const e = validarNuevaContrasena(nueva, confirmacion, actual);
    if (!actual) e.contrasena_actual = 'Ingrese su contraseña actual.';
    setLocal(e);
    if (Object.keys(e).length) return;
    try {
      await acciones.cambiarContrasena({
        contrasena_actual: actual,
        contrasena_nueva: nueva,
        contrasena_nueva_confirmation: confirmacion,
      });
      toast.exito('Su contraseña se actualizó correctamente.');
      navegar('/panel', { replace: true });
    } catch {
      /* el error se muestra en el formulario */
    }
  };

  const err = combinarErrores(local, erroresDeCampos(errores.cambiarContrasena));
  const errorGeneral =
    errores.cambiarContrasena && !Object.keys(erroresDeCampos(errores.cambiarContrasena)).length
      ? errores.cambiarContrasena
      : undefined;

  return (
    <MarcoAutenticacion
      titulo="Cambiar contraseña"
      subtitulo={
        obligatorio
          ? 'Por seguridad, debe reemplazar la contraseña temporal antes de continuar.'
          : 'Elija una contraseña nueva para su cuenta.'
      }
      pie={
        obligatorio ? (
          <button
            type="button"
            onClick={async () => {
              await acciones.cerrarSesion();
              navegar('/panel/login', { replace: true });
            }}
            className="font-semibold text-primary hover:underline"
          >
            Cerrar sesión
          </button>
        ) : (
          <Link to="/panel" className="font-semibold text-primary hover:underline">
            Volver al panel
          </Link>
        )
      }
    >
      <Formulario onEnviar={enviar} error={errorGeneral} aria-label="Cambio de contraseña">
        <CampoContrasena
          etiqueta="Contraseña actual"
          name="contrasena_actual"
          autoComplete="current-password"
          value={actual}
          onChange={(e) => setActual(e.target.value)}
          error={err.contrasena_actual}
          requerido
        />
        <CampoContrasena
          etiqueta="Nueva contraseña"
          name="contrasena_nueva"
          autoComplete="new-password"
          value={nueva}
          onChange={(e) => setNueva(e.target.value)}
          error={err.contrasena_nueva}
          requerido
        />
        <ReglasContrasena valor={nueva} reglas={REGLAS_CONTRASENA} />
        <CampoContrasena
          etiqueta="Confirmar nueva contraseña"
          name="contrasena_nueva_confirmation"
          autoComplete="new-password"
          value={confirmacion}
          onChange={(e) => setConfirmacion(e.target.value)}
          error={err.contrasena_nueva_confirmation}
          requerido
        />
        <Boton type="submit" cargando={estado.cambiando} className="w-full">
          Guardar contraseña
        </Boton>
      </Formulario>
    </MarcoAutenticacion>
  );
}
