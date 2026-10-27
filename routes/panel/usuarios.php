<?php

use App\Http\Controllers\Api\Panel\BitacoraController;
use App\Http\Controllers\Api\Panel\RolesController;
use App\Http\Controllers\Api\Panel\SolicitudesController;
use App\Http\Controllers\Api\Panel\UsuariosController;
use Illuminate\Support\Facades\Route;

/*
 * Usuarios, solicitudes de acceso, bitácora y roles (5.2). Matriz de permisos 3.3:
 * ver usuarios/solicitudes/bitácora y registrar solicitudes: A, R; resolver solicitudes: R;
 * ejecutar solicitudes y editar datos: A. No existe ruta de borrado de usuarios.
 */
Route::middleware(['auth', 'activo', 'cambio_contrasena'])->group(function (): void {
    Route::get('roles', [RolesController::class, 'index'])->name('roles.index');

    Route::middleware('rol:Administrador,Revisor')->group(function (): void {
        Route::get('usuarios', [UsuariosController::class, 'index'])->name('usuarios.index');
        Route::get('usuarios/{id}', [UsuariosController::class, 'show'])->whereNumber('id')->name('usuarios.show');
        Route::get('solicitudes', [SolicitudesController::class, 'index'])->name('solicitudes.index');
        Route::post('solicitudes', [SolicitudesController::class, 'store'])->name('solicitudes.store');
        Route::get('bitacora', [BitacoraController::class, 'index'])->name('bitacora.index');
    });

    Route::middleware('rol:Revisor')->group(function (): void {
        Route::post('solicitudes/{id}/autorizar', [SolicitudesController::class, 'autorizar'])->whereNumber('id')->name('solicitudes.autorizar');
        Route::post('solicitudes/{id}/denegar', [SolicitudesController::class, 'denegar'])->whereNumber('id')->name('solicitudes.denegar');
    });

    Route::middleware('rol:Administrador')->group(function (): void {
        Route::post('usuarios', [UsuariosController::class, 'store'])->name('usuarios.store');
        Route::patch('usuarios/{id}', [UsuariosController::class, 'update'])->whereNumber('id')->name('usuarios.update');
        Route::post('usuarios/{id}/cambiar-rol', [UsuariosController::class, 'cambiarRol'])->whereNumber('id')->name('usuarios.cambiar-rol');
        Route::post('usuarios/{id}/desactivar', [UsuariosController::class, 'desactivar'])->whereNumber('id')->name('usuarios.desactivar');
    });
});
