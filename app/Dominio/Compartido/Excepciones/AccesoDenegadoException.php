<?php

namespace App\Dominio\Compartido\Excepciones;

/**
 * El actor no tiene permiso para la operación (403 `ROL_NO_AUTORIZADO`, SQLSTATE `RN403`).
 * Se reutiliza con otro código para `CUENTA_INACTIVA` o `CAMBIO_CONTRASENA_REQUERIDO`.
 */
class AccesoDenegadoException extends ExcepcionDominio
{
    public const SQLSTATE = 'RN403';

    public function estadoHttp(): int
    {
        return 403;
    }

    public function sqlstate(): string
    {
        return self::SQLSTATE;
    }

    protected function codigoPorDefecto(): string
    {
        return 'ROL_NO_AUTORIZADO';
    }
}
