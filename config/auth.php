<?php

/*
 * Autenticación del panel (docs/DISENO_BACKEND.md, 3.1): sesión de Laravel + CSRF, sin Sanctum.
 *
 * El guard `web` (por defecto) usa el proveedor `usuarios` sobre la tabla `usuario`, con el modelo
 * Eloquent de solo lectura `App\Persistencia\Usuarios\UsuarioAutenticable` (lo crea el paquete B4).
 * Ese modelo debe implementar `App\Dominio\Compartido\UsuarioAutenticado` para los middlewares
 * `activo`, `cambio_contrasena` y `rol:`. La tabla `users` y `App\Models\User` ya no existen.
 */
return [

    'defaults' => [
        'guard' => env('AUTH_GUARD', 'web'),
        'passwords' => env('AUTH_PASSWORD_BROKER', 'usuarios'),
    ],

    'guards' => [
        'web' => [
            'driver' => 'session',
            'provider' => 'usuarios',
        ],
    ],

    'providers' => [
        'usuarios' => [
            'driver' => 'eloquent',
            'model' => env('AUTH_MODEL', 'App\\Persistencia\\Usuarios\\UsuarioAutenticable'),
        ],
    ],

    /*
     * No se usa el broker de Laravel: la recuperación usa la tabla `token_recuperacion` y
     * `sp_token_recuperacion_*` (3.4). Se deja declarado solo para que la configuración sea consistente.
     */
    'passwords' => [
        'usuarios' => [
            'provider' => 'usuarios',
            'table' => 'token_recuperacion',
            'expire' => 60,
            'throttle' => 60,
        ],
    ],

    'password_timeout' => env('AUTH_PASSWORD_TIMEOUT', 10800),

];
