<?php

namespace App\Http\Middleware;

use App\Dominio\Compartido\UsuarioAutenticado;
use App\Http\Soporte\RespuestaError;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Alias `activo`. El guard relee al usuario en cada petición; si su estado es `inactivo`,
 * cierra la sesión y responde 401 `SESION_REVOCADA` (defensa adicional al borrado de `sessions`).
 */
class UsuarioActivo
{
    /**
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $usuario = $request->user();

        if ($usuario instanceof UsuarioAutenticado && ! $usuario->estaActivo()) {
            Auth::guard()->logout();

            if ($request->hasSession()) {
                $request->session()->invalidate();
                $request->session()->regenerateToken();
            }

            return RespuestaError::json(401, 'SESION_REVOCADA', 'Su cuenta fue desactivada. La sesión se cerró.');
        }

        return $next($request);
    }
}
