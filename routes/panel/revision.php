<?php

use App\Http\Controllers\Api\Panel\RevisionController;
use Illuminate\Support\Facades\Route;

/*
 * Revisión común (sección 5.2). {entidad} ∈ publicacion|docente|plan|documento|campana.
 */
Route::middleware(['auth', 'activo', 'cambio_contrasena'])
    ->prefix('revision')
    ->whereNumber('id')
    ->group(function (): void {
        Route::middleware('rol:Revisor')->group(function (): void {
            Route::get('/pendientes', [RevisionController::class, 'pendientes']);
            Route::post('/{entidad}/{id}/decidir', [RevisionController::class, 'decidir']);
        });
        Route::get('/{entidad}/{id}/historial', [RevisionController::class, 'historial'])->middleware('rol:Editor,Revisor');
    });
