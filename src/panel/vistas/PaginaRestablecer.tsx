import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { MarcoAutenticacion } from '../layout/MarcoAutenticacion';
import { Boton, BotonEnlace } from '../componentes/Boton';
import { AlertaFormulario, Formulario, combinarErrores } from '../componentes/Formulario';
import { CampoContrasena, ReglasContrasena } from '../componentes/CampoContrasena';
import { erroresDeCampos } from '../../lib/api';
import {
  REGLAS_CONTRASENA,
  useAutenticacionController,
  validarNuevaContrasena,
} from '../controladores/AutenticacionController';

/** `/panel/restablecer?token=…&correo=…` (invitado; enlace del correo de recuperación). */
export default function PaginaRestablecer() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const correo = params.get('correo') ?? '';
  const { estado, errores, acciones } = useAutenticacionController();
  const [nueva, setNueva] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [local, setLocal] = useState<Record<string, string>>({});

  const enviar = () => {
    const e = validarNuevaContrasena(nueva, confirmacion);
    setLocal(e);
    if (Object.keys(e).length) return;
    acciones
      .restablecer({ correo, token, contrasena_nueva: nueva, contrasena_nueva_confirmation: confirmacion })
      .catch(() => undefined);
  };

  const pie = (
    <Link to="/panel/recuperar" className="font-semibold text-primary hover:underline">
      Solicitar un enlace nuevo
    </Link>
  );

  if (!token || !correo) {
    return (
      <MarcoAutenticacion titulo="Enlace no válido" pie={pie}>
        <AlertaFormulario error="El enlace de restablecimiento está incompleto o ha caducado." />
      </MarcoAutenticacion>
    );
  }

  if (estado.restablecida) {
    return (
      <MarcoAutenticacion titulo="Contraseña restablecida">
        <div role="status" className="space-y-5">
          <p className="flex gap-3 rounded-md bg-green-50 px-4 py-3 text-sm text-green-900">
            <CheckCircle2 aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-success" />
            Su contraseña se actualizó. Ya puede iniciar sesión.
          </p>
          <BotonEnlace to="/panel/login" className="w-full">
            Iniciar sesión
          </BotonEnlace>
        </div>
      </MarcoAutenticacion>
    );
  }

  const campos = erroresDeCampos(errores.restablecer);
  const err = combinarErrores(local, campos);
  // Un error del token (o del correo) no tiene campo visible: se muestra arriba.
  const errorGeneral = errores.restablecer
    ? campos.token?.[0] ?? campos.correo?.[0] ?? (Object.keys(campos).length ? undefined : errores.restablecer)
    : undefined;

  return (
    <MarcoAutenticacion
      titulo="Restablecer contraseña"
      subtitulo={
        <>
          Cuenta: <strong className="text-ink">{correo}</strong>
        </>
      }
      pie={pie}
    >
      <Formulario onEnviar={enviar} error={errorGeneral} aria-label="Restablecer contraseña">
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
        <Boton type="submit" cargando={estado.restableciendo} className="w-full">
          Restablecer contraseña
        </Boton>
      </Formulario>
    </MarcoAutenticacion>
  );
}
