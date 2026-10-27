<?php

use App\Http\Controllers\Api\Publico\ConsultasPublicasController;
use App\Http\Controllers\Api\Publico\VisitasController;
use Illuminate\Support\Facades\Route;

/*
 * Consultas de contacto y registro de visitas (sección 5.3).
 */
Route::post('/consultas', [ConsultasPublicasController::class, 'store'])->middleware('throttle:consultas');
Route::post('/visitas', [VisitasController::class, 'store'])->middleware('throttle:visitas');
