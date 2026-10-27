<?php

namespace App\Aplicacion\ConsultasVisitas;

use App\Dominio\Compartido\Excepciones\ReglaNegocioException;
use App\Dominio\ConsultasVisitas\SeccionVisita;
use App\Persistencia\ConsultasVisitas\BusquedaRepositorio;
use App\Persistencia\ConsultasVisitas\VisitaRepositorio;

/**
 * Búsqueda pública (mínimo 3 caracteres); registra la visita `busqueda`.
 */
class BusquedaServicio
{
    public function __construct(
        private readonly BusquedaRepositorio $repositorio,
        private readonly VisitaRepositorio $visitas,
    ) {}

    /**
     * @return list<array{tipo: string, titulo: string, extracto: string, ruta: string}>
     */
    public function buscar(string $texto): array
    {
        $texto = trim($texto);
        if (mb_strlen($texto) < 3) {
            throw new ReglaNegocioException('Escriba al menos 3 caracteres.', 'q');
        }

        $this->visitas->registrar(SeccionVisita::Busqueda->value);

        return $this->repositorio->buscar($texto);
    }
}
