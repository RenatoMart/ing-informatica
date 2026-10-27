<?php

namespace App\Persistencia\ConsultasVisitas;

use App\Persistencia\Compartido\Repositorio;

/**
 * Visitas anónimas por sección.
 */
class VisitaRepositorio extends Repositorio
{
    public function registrar(string $seccion): void
    {
        $this->sp->ejecutar('sp_visita_registrar', [$seccion]);
    }

    /**
     * @return list<array{seccion: string, dia: string, total: int}>
     */
    public function estadisticas(string $desde, string $hasta): array
    {
        return array_map(static fn (array $f): array => [
            'seccion' => (string) $f['seccion'],
            'dia' => (string) $f['dia'],
            'total' => (int) $f['total'],
        ], $this->sp->filas('sp_visita_estadisticas', [$desde, $hasta]));
    }
}
