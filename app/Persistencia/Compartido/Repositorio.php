<?php

namespace App\Persistencia\Compartido;

use App\Dominio\Compartido\Excepciones\NoEncontradoException;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;

/**
 * Base opcional de los repositorios concretos (sin interfaces, sección 1.1).
 * Aporta el ejecutor de `sp_*`, el paginador y atajos de lectura con Query Builder.
 */
abstract class Repositorio
{
    public function __construct(
        protected readonly EjecutorProcedimientos $sp,
        protected readonly Paginador $paginador,
    ) {}

    protected function tabla(string $tablaOVista): Builder
    {
        return DB::table($tablaOVista);
    }

    /**
     * Primera fila de la consulta como arreglo, o 404 si no existe.
     *
     * @return array<string, mixed>
     *
     * @throws NoEncontradoException
     */
    protected function primeraOFallar(Builder $consulta, string $mensaje = 'Registro no encontrado.'): array
    {
        $fila = $consulta->first();

        if ($fila === null) {
            throw new NoEncontradoException($mensaje);
        }

        return (array) $fila;
    }

    /**
     * Todas las filas de la consulta como arreglos.
     *
     * @return list<array<string, mixed>>
     */
    protected function todas(Builder $consulta): array
    {
        return $consulta->get()->map(static fn (object $fila): array => (array) $fila)->values()->all();
    }
}
