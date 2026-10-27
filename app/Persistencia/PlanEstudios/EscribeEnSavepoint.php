<?php

namespace App\Persistencia\PlanEstudios;

use Illuminate\Support\Facades\DB;

/**
 * Ejecuta cada escritura `sp_*` dentro de una transacción (o savepoint si ya hay una abierta), de modo que un
 * error de regla de negocio revierta solo esa operación y no deje abortada la transacción envolvente.
 */
trait EscribeEnSavepoint
{
    /**
     * @template T
     *
     * @param  callable(): T  $operacion
     * @return T
     */
    protected function escribir(callable $operacion): mixed
    {
        return DB::transaction($operacion);
    }
}
