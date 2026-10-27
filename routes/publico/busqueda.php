<?php

use App\Http\Controllers\Api\Publico\BusquedaController;
use Illuminate\Support\Facades\Route;

/*
 * Búsqueda pública (sección 5.3).
 */
Route::get('/buscar', [BusquedaController::class, 'index']);
