<?php

namespace App\Dominio\DocumentosAdmision;

use App\Dominio\Compartido\Arreglable;
use App\Dominio\Compartido\Excepciones\ReglaNegocioException;

/**
 * Modalidad de ingreso de una campaña: nombre ≤ 100, dirigido a ≤ 150 y vacantes > 0.
 */
final readonly class ModalidadAdmision implements Arreglable
{
    private function __construct(
        public string $nombre,
        public ?string $dirigidoA,
        public int $vacantes,
        public ?string $descripcion,
    ) {}

    /**
     * @throws ReglaNegocioException
     */
    public static function crear(string $nombre, ?string $dirigidoA, int $vacantes, ?string $descripcion): self
    {
        $nombre = trim($nombre);

        if ($nombre === '' || mb_strlen($nombre) > 100) {
            throw new ReglaNegocioException('El nombre es obligatorio (máximo 100 caracteres).', 'nombre');
        }

        $dirigidoA = $dirigidoA === null ? null : trim($dirigidoA);
        $dirigidoA = $dirigidoA === '' ? null : $dirigidoA;

        if ($dirigidoA !== null && mb_strlen($dirigidoA) > 150) {
            throw new ReglaNegocioException('"Dirigido a" no puede superar 150 caracteres.', 'dirigido_a');
        }

        if ($vacantes <= 0) {
            throw new ReglaNegocioException('Las vacantes deben ser mayores que cero.', 'vacantes');
        }

        $descripcion = $descripcion === null ? null : trim($descripcion);

        return new self($nombre, $dirigidoA, $vacantes, $descripcion === '' ? null : $descripcion);
    }

    /**
     * @return array<string, mixed>
     */
    public function aArreglo(): array
    {
        return [
            'nombre' => $this->nombre,
            'dirigido_a' => $this->dirigidoA,
            'vacantes' => $this->vacantes,
            'descripcion' => $this->descripcion,
        ];
    }
}
