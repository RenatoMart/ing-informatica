<?php

namespace App\Persistencia\Usuarios;

use DateTimeImmutable;
use DateTimeInterface;
use DateTimeZone;
use Throwable;

/**
 * Convierte las fechas de PostgreSQL (`TIMESTAMP` en hora de Lima o `TIMESTAMPTZ`) a ISO 8601 con zona.
 */
final class FechasSql
{
    public static function iso(mixed $valor): ?string
    {
        if ($valor === null || $valor === '') {
            return null;
        }

        try {
            return (new DateTimeImmutable((string) $valor, new DateTimeZone(date_default_timezone_get())))
                ->format(DateTimeInterface::ATOM);
        } catch (Throwable) {
            return (string) $valor;
        }
    }
}
