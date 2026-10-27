<?php

use App\Http\Controllers\Api\Panel\AuthController;
use Illuminate\Support\Facades\Route;

/*
 * Autenticación del panel (docs/DISENO_BACKEND.md 3.1 y 5.2). Prefijo api/panel y grupo `web` (sesión + CSRF).
 * `cambio_contrasena` deja pasar auth/yo, auth/logout y auth/cambiar-contrasena.
 */
Route::prefix('auth')->name('auth.')->group(function (): void {
    Route::post('login', [AuthController::class, 'iniciarSesion'])->middleware('throttle:login')->name('login');
    Route::post('recuperar', [AuthController::class, 'recuperar'])->middleware('throttle:recuperar')->name('recuperar');
    Route::post('restablecer', [AuthController::class, 'restablecer'])->middleware('throttle:10,1')->name('restablecer');

    Route::middleware(['auth', 'activo', 'cambio_contrasena'])->group(function (): void {
        Route::post('logout', [AuthController::class, 'cerrarSesion'])->name('logout');
        Route::get('yo', [AuthController::class, 'yo'])->name('yo');
        Route::post('cambiar-contrasena', [AuthController::class, 'cambiarContrasena'])->name('cambiar-contrasena');
    });
});
