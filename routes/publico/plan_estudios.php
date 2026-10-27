<?php

use App\Http\Controllers\Api\Publico\PlanEstudiosPublicoController;
use Illuminate\Support\Facades\Route;

/*
 * Plan de estudios público (sección 5.3): solo vigente e histórico.
 */
Route::get('planes', [PlanEstudiosPublicoController::class, 'index']);
Route::get('planes/predeterminado', [PlanEstudiosPublicoController::class, 'predeterminado']);
Route::get('planes/{id}', [PlanEstudiosPublicoController::class, 'show'])->whereNumber('id');
