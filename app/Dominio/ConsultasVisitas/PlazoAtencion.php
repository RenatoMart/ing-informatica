<?php

namespace App\Dominio\ConsultasVisitas;

use DateTimeImmutable;
use DateTimeInterface;

/**
 * Plazos de atención en días hábiles (lunes a viernes, sin feriados): clasificar en 2 y responder en 5.
 */
final class PlazoAtencion
{
    public const CLASIFICACION = 2;

    public const RESPUESTA = 5;

    /** Días hábiles transcurridos desde `$desde` hasta `$ahora`, sin contar el día inicial. */
    public static function diasHabiles(DateTimeInterface $desde, DateTimeInterface $ahora): int
    {
        $dia = DateTimeImmutable::createFromInterface($desde)->setTime(0, 0);
        $fin = DateTimeImmutable::createFromInterface($ahora)->setTime(0, 0);
        $total = 0;

        while ($dia < $fin) {
            $dia = $dia->modify('+1 day');
            if ((int) $dia->format('N') < 6) {
                $total++;
            }
        }

        return $total;
    }

    /** Plazo (en días hábiles) que corresponde al estado, o `null` si ya no corre plazo. */
    public static function plazoDe(EstadoConsulta $estado): ?int
    {
        return match ($estado) {
            EstadoConsulta::Recibida => self::CLASIFICACION,
            EstadoConsulta::EnAtencion => self::RESPUESTA,
            default => null,
        };
    }

    public static function vencida(EstadoConsulta $estado, DateTimeInterface $desde, DateTimeInterface $ahora): bool
    {
        $plazo = self::plazoDe($estado);

        return $plazo !== null && self::diasHabiles($desde, $ahora) > $plazo;
    }
}
