<?php

namespace App\Dominio\Usuarios;

/**
 * `bitacora_acceso.accion`: literales del diccionario más los valores [EXTRA] de 3.6.
 */
enum AccionBitacora: string
{
    case Alta = 'alta';
    case CambioRol = 'cambio_rol';
    case Baja = 'baja';
    case Recuperacion = 'recuperacion';
    case Denegado = 'denegado';
    case InicioSesion = 'inicio_sesion';
    case CierreSesion = 'cierre_sesion';
    case AccesoFallido = 'acceso_fallido';
    case CambioContrasena = 'cambio_contrasena';
    case EdicionDatos = 'edicion_datos';
}
