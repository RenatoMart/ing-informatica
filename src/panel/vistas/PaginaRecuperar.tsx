import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import { MarcoAutenticacion } from '../layout/MarcoAutenticacion';
import { Boton } from '../componentes/Boton';
import { CampoTexto, Formulario, errorDe } from '../componentes/Formulario';
import { erroresDeCampos, esApiError } from '../../lib/api';
import { useAutenticacionController, validarCorreo } from '../controladores/AutenticacionController';

/** `/panel/recuperar` (invitado). Siempre responde igual para no revelar si el correo existe. */
export default function PaginaRecuperar() {
  const { estado, errores, acciones } = useAutenticacionController();
  const [correo, setCorreo] = useState('');
  const [errorCorreo, setErrorCorreo] = useState<string | null>(null);

  const enviar = () => {
    const e = validarCorreo(correo);
    setErrorCorreo(e);
    if (e) return;
    acciones.recuperar(correo).catch(() => undefined);
  };

  const error = errores.recuperar;
  const errorGeneral =
    error && esApiError(error) && error.codigo === 'DEMASIADOS_INTENTOS'
      ? 'Ha realizado demasiadas solicitudes. Intente de nuevo en una hora.'
      : error && !Object.keys(erroresDeCampos(error)).length
        ? error
        : undefined;

  return (
    <MarcoAutenticacion
      titulo="Recuperar acceso"
      subtitulo="Le enviaremos un enlace para restablecer su contraseña."
      pie={
        <Link to="/panel/login" className="font-semibold text-primary hover:underline">
          Volver a iniciar sesión
        </Link>
      }
    >
      {estado.recuperacionEnviada ? (
        <div role="status" className="flex gap-3 rounded-md bg-green-50 px-4 py-3 text-sm text-green-900">
          <MailCheck aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-success" />
          <p>
            Si el correo existe, enviamos un enlace para restablecer la contraseña. Revise su bandeja de entrada
            (y la carpeta de spam).
          </p>
        </div>
      ) : (
        <Formulario onEnviar={enviar} error={errorGeneral} aria-label="Recuperación de acceso">
          <CampoTexto
            etiqueta="Correo institucional"
            type="email"
            name="correo"
            autoComplete="email"
            inputMode="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            error={errorCorreo ?? errorDe(erroresDeCampos(error), 'correo')}
            requerido
          />
          <Boton type="submit" cargando={estado.recuperando} className="w-full">
            Enviar enlace
          </Boton>
        </Formulario>
      )}
    </MarcoAutenticacion>
  );
}
