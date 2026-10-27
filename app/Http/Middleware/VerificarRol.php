<?php

namespace App\Http\Middleware;

use App\Dominio\Compartido\UsuarioAutenticado;
use App\Http\Soporte\RespuestaError;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Alias `rol`. Uso: `->middleware('rol:Editor,Revisor')`. Responde 403 `ROL_NO_AUTORIZADO`
 * si el rol del usuario (`rol.nombre`) no está en la lista (matriz de permisos 3.3).
 */
class VerificarRol
{
    /**
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $usuario = $request->user();

        if (! $usuario instanceof UsuarioAutenticado) {
            return RespuestaError::json(401, 'NO_AUTENTICADO', 'Debe iniciar sesión.');
        }

        if (! in_array($usuario->nombreRol(), $roles, true)) {
            return RespuestaError::json(403, 'ROL_NO_AUTORIZADO', 'Su rol no tiene permiso para esta acción.');
        }

        return $next($request);
    }
}
