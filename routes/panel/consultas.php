<?php

use App\Http\Controllers\Api\Panel\ConsultasController;
use App\Http\Controllers\Api\Panel\DashboardController;
use App\Http\Controllers\Api\Panel\EstadisticasController;
use Illuminate\Support\Facades\Route;

/*
 * Consultas (Editor/Revisor), estadísticas y dashboard (cualquier usuario autenticado). Sección 5.2.
 */
Route::middleware(['auth', 'activo', 'cambio_contrasena'])->group(function (): void {
    Route::get('/dashboard', DashboardController::class);
    Route::get('/estadisticas/visitas', [EstadisticasController::class, 'visitas']);

    Route::middleware('rol:Editor,Revisor')->whereNumber('id')->prefix('consultas')->group(function (): void {
        Route::get('/', [ConsultasController::class, 'index']);
        Route::get('/{id}', [ConsultasController::class, 'show']);
        Route::post('/{id}/clasificar', [ConsultasController::class, 'clasificar']);
        Route::post('/{id}/responder', [ConsultasController::class, 'responder']);
    });
});
