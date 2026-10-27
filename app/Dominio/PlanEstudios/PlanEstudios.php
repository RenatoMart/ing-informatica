<?php

namespace App\Dominio\PlanEstudios;

use App\Dominio\Compartido\Arreglable;
use App\Dominio\Compartido\Excepciones\ReglaNegocioException;
use App\Dominio\Compartido\Excepciones\TransicionInvalidaException;

/**
 * Versión del plan de estudios (año 2000..2100, versión ≤20). Solo se edita en `borrador`.
 */
final class PlanEstudios implements Arreglable
{
    public readonly string $version;

    /**
     * @throws ReglaNegocioException
     */
    public function __construct(
        public readonly int $anio,
        string $version,
        public readonly EstadoPlan $estado = EstadoPlan::Borrador,
        public readonly bool $esPredeterminada = false,
        public readonly ?int $idPlan = null,
    ) {
        if ($anio < 2000 || $anio > 2100) {
            throw new ReglaNegocioException('El año debe estar entre 2000 y 2100.', 'anio');
        }

        $this->version = trim($version);

        if ($this->version === '' || mb_strlen($this->version) > 20) {
            throw new ReglaNegocioException('La versión es obligatoria (máximo 20 caracteres).', 'version');
        }
    }

    /**
     * @throws TransicionInvalidaException
     */
    public function exigirEditable(): void
    {
        if (! $this->estado->esEditable()) {
            throw new TransicionInvalidaException('Solo se puede modificar un plan en borrador.');
        }
    }

    /** @return array<string, mixed> */
    public function aArreglo(): array
    {
        return [
            'id_plan' => $this->idPlan,
            'anio' => $this->anio,
            'version' => $this->version,
            'estado' => $this->estado->value,
            'es_predeterminada' => $this->esPredeterminada,
        ];
    }
}
