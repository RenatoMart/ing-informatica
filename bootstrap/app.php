<?php

use App\Dominio\Compartido\Excepciones\ExcepcionDominio;
use App\Http\Middleware\ExigirCambioContrasena;
use App\Http\Middleware\UsuarioActivo;
use App\Http\Middleware\VerificarRol;
use App\Http\Soporte\LimitesDeTasa;
use App\Http\Soporte\RenderizadorErroresApi;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        then: function (): void {
            /*
             * Panel: grupo `web` (sesión por cookie + CSRF con X-XSRF-TOKEN), prefijo api/panel.
             * Público: grupo `api` (sin estado ni CSRF) con throttle:publico, prefijo api/publico.
             * Cada módulo agrega su archivo en routes/panel/*.php o routes/publico/*.php.
             */
            Route::middleware('web')
                ->prefix('api/panel')
                ->name('panel.')
                ->group(base_path('routes/panel.php'));

            Route::middleware(['api', 'throttle:publico'])
                ->prefix('api/publico')
                ->name('publico.')
                ->group(base_path('routes/publico.php'));
        },
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'activo' => UsuarioActivo::class,
            'cambio_contrasena' => ExigirCambioContrasena::class,
            'rol' => VerificarRol::class,
        ]);

        $middleware->redirectGuestsTo(fn (Request $request): ?string => RenderizadorErroresApi::aplica($request) ? null : '/panel/login');

        $middleware->trustProxies(at: '*');
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request): bool => RenderizadorErroresApi::aplica($request) || $request->expectsJson(),
        );

        $exceptions->dontReport([ExcepcionDominio::class]);

        $exceptions->render(new RenderizadorErroresApi);
    })
    ->booted(function (): void {
        LimitesDeTasa::registrar();
    })
    ->create();
