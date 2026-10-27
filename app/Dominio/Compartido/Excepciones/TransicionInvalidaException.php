<?php

namespace App\Dominio\Compartido\Excepciones;

/**
 * La acción no está permitida en el estado actual (409 `ESTADO_INVALIDO`, SQLSTATE `RN409`).
 */
class TransicionInvalidaException extends ExcepcionDominio
{
    public const SQLSTATE = 'RN409';

    public function estadoHttp(): int
    {
        return 409;
    }

    public function sqlstate(): string
    {
        return self::SQLSTATE;
    }

    protected function codigoPorDefecto(): string
    {
        return 'ESTADO_INVALIDO';
    }
}
