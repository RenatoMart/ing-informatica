<?php

namespace App\Dominio\Docentes;

use App\Dominio\Compartido\Arreglable;
use App\Dominio\Compartido\Excepciones\ReglaNegocioException;

/**
 * Encuadre de la foto: posición x/y en porcentaje (0–100) para `object-position`.
 */
final readonly class Encuadre implements Arreglable
{
    public const DEFECTO_X = 50;

    public const DEFECTO_Y = 25;

    /**
     * @throws ReglaNegocioException
     */
    public function __construct(public int $x = self::DEFECTO_X, public int $y = self::DEFECTO_Y)
    {
        if ($x < 0 || $x > 100 || $y < 0 || $y > 100) {
            throw new ReglaNegocioException('El encuadre debe estar entre 0 y 100.', 'encuadre');
        }
    }

    /** Valor CSS `object-position`, p. ej. `"50% 25%"`. */
    public function aObjectPosition(): string
    {
        return "{$this->x}% {$this->y}%";
    }

    /**
     * @return array{encuadre_x: int, encuadre_y: int}
     */
    public function aArreglo(): array
    {
        return ['encuadre_x' => $this->x, 'encuadre_y' => $this->y];
    }
}
