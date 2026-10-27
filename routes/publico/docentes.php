<?php

use App\Http\Controllers\Api\Publico\DocentesPublicosController;
use Illuminate\Support\Facades\Route;

/*
 * Plana docente y departamentos públicos (sección 5.3).
 */
Route::get('/departamentos', [DocentesPublicosController::class, 'departamentos']);
Route::get('/docentes', [DocentesPublicosController::class, 'docentes']);
