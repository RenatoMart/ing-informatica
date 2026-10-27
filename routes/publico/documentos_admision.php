<?php

use App\Http\Controllers\Api\Publico\AdmisionPublicaController;
use App\Http\Controllers\Api\Publico\DocumentosPublicosController;
use Illuminate\Support\Facades\Route;

/*
 * Sitio público: documentos oficiales y admisión (sección 5.3). Solo contenido vigente/histórico.
 */
Route::get('/documentos', [DocumentosPublicosController::class, 'index'])->name('documentos.index');
Route::get('/admision', [AdmisionPublicaController::class, 'show'])->name('admision.show');
