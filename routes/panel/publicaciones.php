<?php

use App\Http\Controllers\Api\Panel\PublicacionesController;
use Illuminate\Support\Facades\Route;

/*
 * Publicaciones del panel (sección 5.2). Rol Editor o Revisor; la decisión del Director va por
 * /revision/{entidad}/{id}/decidir (routes/panel/revision.php).
 */
Route::middleware(['auth', 'activo', 'cambio_contrasena', 'rol:Editor,Revisor'])
    ->prefix('publicaciones')
    ->whereNumber(['id', 'idArchivo'])
    ->group(function (): void {
        Route::get('/', [PublicacionesController::class, 'index']);
        Route::post('/', [PublicacionesController::class, 'store']);
        Route::get('/{id}', [PublicacionesController::class, 'show']);
        Route::put('/{id}', [PublicacionesController::class, 'update']);
        Route::post('/{id}/imagenes', [PublicacionesController::class, 'subirImagen']);
        Route::delete('/{id}/imagenes/{idArchivo}', [PublicacionesController::class, 'quitarImagen']);
        Route::post('/{id}/enviar-revision', [PublicacionesController::class, 'enviarRevision']);
        Route::post('/{id}/solicitar-baja', [PublicacionesController::class, 'solicitarBaja']);
        Route::post('/{id}/descartar', [PublicacionesController::class, 'descartar']);
    });
