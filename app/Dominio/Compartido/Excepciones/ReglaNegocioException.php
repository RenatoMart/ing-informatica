<?php

namespace App\Dominio\Compartido\Excepciones;

/**
 * Regla de negocio incumplida (422 `REGLA_NEGOCIO`, SQLSTATE `RN422`).
 * El campo viaja en `DETAIL` desde PL/pgSQL.
 */
class ReglaNegocioException extends ExcepcionDominio
{
    public const SQLSTATE = 'RN422';

    public function estadoHttp(): int
    {
        return 422;
    }

    public function sqlstate(): string
    {
        return self::SQLSTATE;
    }

    protected function codigoPorDefecto(): string
    {
        return 'REGLA_NEGOCIO';
    }
}
