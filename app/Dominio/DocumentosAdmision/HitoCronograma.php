<?php

namespace App\Dominio\DocumentosAdmision;

use App\Dominio\Compartido\Arreglable;
use App\Dominio\Compartido\Excepciones\ReglaNegocioException;
use DateTimeImmutable;

/**
 * Hito del cronograma: nombre ≤ 150 y fecha dentro de [inicio, fin] de la campaña.
 */
final readonly class HitoCronograma implements Arreglable
{
    private function __construct(public string $hito, public DateTimeImmutable $fecha) {}

    /**
     * @param  DateTimeImmutable|null  $inicio  Inicio de la campaña (si ya se definió).
     * @param  DateTimeImmutable|null  $fin  Fin de la campaña (si ya se definió).
     *
     * @throws ReglaNegocioException
     */
    public static function crear(string $hito, DateTimeImmutable $fecha, ?DateTimeImmutable $inicio = null, ?DateTimeImmutable $fin = null): self
    {
        $hito = trim($hito);

        if ($hito === '' || mb_strlen($hito) > 150) {
            throw new ReglaNegocioException('El nombre del hito es obligatorio (máximo 150 caracteres).', 'hito');
        }

        $dia = $fecha->format('Y-m-d');

        if (($inicio !== null && $dia < $inicio->format('Y-m-d')) || ($fin !== null && $dia > $fin->format('Y-m-d'))) {
            throw new ReglaNegocioException('La fecha del hito debe estar dentro del periodo de la campaña.', 'fecha');
        }

        return new self($hito, $fecha);
    }

    /**
     * @return array<string, mixed>
     */
    public function aArreglo(): array
    {
        return ['hito' => $this->hito, 'fecha' => $this->fecha->format('Y-m-d')];
    }
}
