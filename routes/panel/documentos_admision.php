<?php

use App\Http\Controllers\Api\Panel\CampanasController;
use App\Http\Controllers\Api\Panel\DocumentosController;
use App\Http\Controllers\Api\Panel\HitosController;
use App\Http\Controllers\Api\Panel\ModalidadesController;
use Illuminate\Support\Facades\Route;

/*
 * Documentos oficiales y campañas de admisión (HU5, sección 5.2). Rol Editor y Revisor.
 * `POST /documentos/{id}` con `_method=PUT` actualiza (multipart no admite PUT nativo).
 */
Route::middleware(['auth', 'activo', 'cambio_contrasena', 'rol:Editor,Revisor'])->group(function (): void {
    Route::get('/documentos', [DocumentosController::class, 'index'])->name('documentos.index');
    Route::post('/documentos', [DocumentosController::class, 'store'])->name('documentos.store');
    Route::get('/documentos/{id}', [DocumentosController::class, 'show'])->whereNumber('id')->name('documentos.show');
    Route::match(['put', 'post'], '/documentos/{id}', [DocumentosController::class, 'update'])->whereNumber('id')->name('documentos.update');
    Route::post('/documentos/{id}/reenviar', [DocumentosController::class, 'reenviar'])->whereNumber('id')->name('documentos.reenviar');

    Route::get('/campanas', [CampanasController::class, 'index'])->name('campanas.index');
    Route::post('/campanas', [CampanasController::class, 'store'])->name('campanas.store');
    Route::get('/campanas/{id}', [CampanasController::class, 'show'])->whereNumber('id')->name('campanas.show');
    Route::put('/campanas/{id}', [CampanasController::class, 'update'])->whereNumber('id')->name('campanas.update');
    Route::post('/campanas/{id}/duplicar', [CampanasController::class, 'duplicar'])->whereNumber('id')->name('campanas.duplicar');
    Route::post('/campanas/{id}/verificar-enlaces', [CampanasController::class, 'verificarEnlaces'])->whereNumber('id')->name('campanas.verificar_enlaces');
    Route::get('/campanas/{id}/validacion', [CampanasController::class, 'validacion'])->whereNumber('id')->name('campanas.validacion');
    Route::post('/campanas/{id}/enviar-revision', [CampanasController::class, 'enviarRevision'])->whereNumber('id')->name('campanas.enviar_revision');

    Route::post('/campanas/{id}/modalidades', [ModalidadesController::class, 'store'])->whereNumber('id')->name('modalidades.store');
    Route::put('/modalidades/{id}', [ModalidadesController::class, 'update'])->whereNumber('id')->name('modalidades.update');
    Route::delete('/modalidades/{id}', [ModalidadesController::class, 'destroy'])->whereNumber('id')->name('modalidades.destroy');

    Route::post('/campanas/{id}/hitos', [HitosController::class, 'store'])->whereNumber('id')->name('hitos.store');
    Route::put('/hitos/{id}', [HitosController::class, 'update'])->whereNumber('id')->name('hitos.update');
    Route::delete('/hitos/{id}', [HitosController::class, 'destroy'])->whereNumber('id')->name('hitos.destroy');
});
