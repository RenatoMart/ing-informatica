<?php

namespace App\Persistencia\Compartido;

use App\Dominio\Compartido\Paginacion;
use App\Dominio\Compartido\ResultadoPaginado;
use Illuminate\Database\Query\Builder;

/**
 * Aplica `pagina`/`por_pagina` (20 por defecto, 100 como máximo) a una consulta del Query Builder
 * y devuelve un {@see ResultadoPaginado} con el total.
 *
 * Ejemplo en un repositorio:
 * `return $this->paginador->paginar(DB::table('v_x')->where(...)->orderByDesc('fecha'), $paginacion, fn (array $f) => ...);`
 */
class Paginador
{
    /**
     * @template T
     *
     * @param  (callable(array<string, mixed>): T)|null  $transformar  Convierte cada fila (arreglo) en el DTO de salida.
     * @return ResultadoPaginado<T|array<string, mixed>>
     */
    public function paginar(Builder $consulta, Paginacion $paginacion, ?callable $transformar = null): ResultadoPaginado
    {
        $total = (clone $consulta)->reorder()->count();

        $filas = $total === 0 ? [] : $consulta
            ->offset($paginacion->desplazamiento())
            ->limit($paginacion->porPagina)
            ->get()
            ->map(static fn (object $fila): array => (array) $fila)
            ->all();

        $elementos = $transformar === null ? $filas : array_map($transformar, $filas);

        return new ResultadoPaginado(array_values($elementos), $paginacion, $total);
    }
}
