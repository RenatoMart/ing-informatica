<?php

use App\Http\Controllers\Api\Panel\CursosController;
use App\Http\Controllers\Api\Panel\PlanesController;
use Illuminate\Support\Facades\Route;

/*
 * Plan de estudios (HU4, sección 5.2). Editor y Revisor; `predeterminado` solo Revisor.
 */
Route::middleware(['auth', 'activo', 'cambio_contrasena'])->group(function (): void {
    Route::middleware('rol:Editor,Revisor')->group(function (): void {
        Route::get('planes', [PlanesController::class, 'index']);
        Route::post('planes', [PlanesController::class, 'store']);
        Route::get('planes/{id}', [PlanesController::class, 'show'])->whereNumber('id');
        Route::put('planes/{id}', [PlanesController::class, 'update'])->whereNumber('id');
        Route::post('planes/{id}/duplicar', [PlanesController::class, 'duplicar'])->whereNumber('id');
        Route::post('planes/{id}/pdf/{tipo}', [PlanesController::class, 'subirPdf'])->whereNumber('id')->whereIn('tipo', ['plan', 'resolucion']);
        Route::get('planes/{id}/validacion', [PlanesController::class, 'validacion'])->whereNumber('id');
        Route::post('planes/{id}/enviar-revision', [PlanesController::class, 'enviarRevision'])->whereNumber('id');
        Route::post('planes/{id}/cursos', [CursosController::class, 'store'])->whereNumber('id');
        Route::post('planes/{id}/cursos/importar', [CursosController::class, 'importar'])->whereNumber('id');
        Route::put('cursos/{id}', [CursosController::class, 'update'])->whereNumber('id');
        Route::delete('cursos/{id}', [CursosController::class, 'destroy'])->whereNumber('id');
        Route::put('cursos/{id}/prerrequisitos', [CursosController::class, 'prerrequisitos'])->whereNumber('id');
    });

    Route::post('planes/{id}/predeterminado', [PlanesController::class, 'predeterminado'])
        ->whereNumber('id')
        ->middleware('rol:Revisor');
});
