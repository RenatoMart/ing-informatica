<?php

namespace App\Http\Middleware;

use App\Dominio\Compartido\UsuarioAutenticado;
use App\Http\Soporte\RespuestaError;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Alias `cambio_contrasena`. Con `debe_cambiar_contrasena = true` responde 403 `CAMBIO_CONTRASENA_REQUERIDO`
 * en todo el panel salvo `auth/yo`, `auth/logout` y `auth/cambiar-contrasena`.
 */
class ExigirCambioContrasena
{
    /** Rutas (relativas a `api/panel/`) que siguen disponibles mientras el cambio está pendiente. */
    public const RUTAS_PERMITIDAS = ['auth/yo', 'auth/logout', 'auth/cambiar-contrasena'];

    /**
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $usuario = $request->user();

        if ($usuario instanceof UsuarioAutenticado && $usuario->debeCambiarContrasena() && ! $this->esRutaPermitida($request)) {
            return RespuestaError::json(403, 'CAMBIO_CONTRASENA_REQUERIDO', 'Debe cambiar su contraseña antes de continuar.');
        }

        return $next($request);
    }

    private function esRutaPermitida(Request $request): bool
    {
        return $request->is(...array_map(static fn (string $ruta): string => 'api/panel/'.$ruta, self::RUTAS_PERMITIDAS));
    }
}
