<?php

use App\Http\Controllers\Api\Publico\PublicacionesPublicasController;
use Illuminate\Support\Facades\Route;

/*
 * Publicaciones públicas (sección 5.3): listado paginado y detalle de las publicadas.
 */
Route::get('/publicaciones', [PublicacionesPublicasController::class, 'index']);
Route::get('/publicaciones/{id}', [PublicacionesPublicasController::class, 'show'])->whereNumber('id');
