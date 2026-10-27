<?php

namespace App\Dominio\Compartido\Excepciones;

/**
 * Conflicto por duplicado (409 `DUPLICADO`, SQLSTATE `23505` de PostgreSQL).
 */
class ConflictoException extends ExcepcionDominio
{
    public const SQLSTATE = '23505';

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
        return 'DUPLICADO';
    }
}
