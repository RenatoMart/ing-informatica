<?php

use App\Http\Controllers\Api\Panel\DepartamentosController;
use App\Http\Controllers\Api\Panel\DocentesController;
use Illuminate\Support\Facades\Route;

/*
 * Docentes y departamentos del panel (sección 5.2). Rol Editor o Revisor.
 */
Route::middleware(['auth', 'activo', 'cambio_contrasena', 'rol:Editor,Revisor'])
    ->whereNumber('id')
    ->group(function (): void {
        Route::get('/departamentos', [DepartamentosController::class, 'index']);
        Route::post('/departamentos', [DepartamentosController::class, 'store']);
        Route::put('/departamentos/{id}', [DepartamentosController::class, 'update']);

        Route::prefix('docentes')->group(function (): void {
            Route::get('/', [DocentesController::class, 'index']);
            Route::post('/', [DocentesController::class, 'store']);
            Route::get('/{id}', [DocentesController::class, 'show']);
            Route::put('/{id}', [DocentesController::class, 'update']);
            Route::post('/{id}/foto', [DocentesController::class, 'foto']);
            Route::patch('/{id}/encuadre', [DocentesController::class, 'encuadre']);
            Route::post('/{id}/enviar-revision', [DocentesController::class, 'enviarRevision']);
            Route::post('/{id}/solicitar-baja', [DocentesController::class, 'solicitarBaja']);
            Route::post('/{id}/reactivar', [DocentesController::class, 'reactivar']);
        });
    });
