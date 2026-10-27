import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MarcoAutenticacion } from '../layout/MarcoAutenticacion';
import { Boton } from '../componentes/Boton';
import { AlertaFormulario, CampoTexto, Formulario, errorDe } from '../componentes/Formulario';
import { CampoContrasena } from '../componentes/CampoContrasena';
import { erroresDeCampos } from '../../lib/api';
import { mensajeLogin, useAutenticacionController, validarCorreo } from '../controladores/AutenticacionController';

/** `/panel/login` (invitado). Tras el login, RutaInvitado redirige a `?volver=` o `/panel`. */
export default function PaginaLogin() {
  const { estado, errores, acciones } = useAutenticacionController();
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [local, setLocal] = useState<Record<string, string>>({});

  const enviar = () => {
    const e: Record<string, string> = {};
    const ec = validarCorreo(correo);
    if (ec) e.correo = ec;
    if (!contrasena) e.contrasena = 'Ingrese su contraseña.';
    setLocal(e);
    if (Object.keys(e).length) return;
    acciones.iniciarSesion({ correo, contrasena }).catch(() => undefined);
  };

  const servidor = erroresDeCampos(errores.login);
  const mensaje = mensajeLogin(errores.login);

  return (
    <MarcoAutenticacion
      titulo="Iniciar sesión"
      subtitulo="Acceso del personal de la Dirección de Escuela."
    >
      <Formulario onEnviar={enviar} aria-label="Inicio de sesión">
        {mensaje && <AlertaFormulario error={mensaje} />}
        <CampoTexto
          etiqueta="Correo institucional"
          type="email"
          name="correo"
          autoComplete="username"
          inputMode="email"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          error={local.correo ?? (errores.login && errorDe(servidor, 'correo'))}
          requerido
        />
        <CampoContrasena
          etiqueta="Contraseña"
          name="contrasena"
          autoComplete="current-password"
          value={contrasena}
          onChange={(e) => setContrasena(e.target.value)}
          error={local.contrasena ?? (errores.login && errorDe(servidor, 'contrasena'))}
          requerido
        />
        <div className="flex items-center justify-end">
          <Link to="/panel/recuperar" className="text-sm font-semibold text-primary hover:underline">
            ¿Olvidó su contraseña?
          </Link>
        </div>
        <Boton type="submit" cargando={estado.iniciando} className="w-full">
          {estado.iniciando ? 'Ingresando…' : 'Ingresar'}
        </Boton>
      </Formulario>
    </MarcoAutenticacion>
  );
}
