<?php

namespace App\Http\Controllers\Api\Panel;

use App\Aplicacion\Usuarios\AutenticacionServicio;
use App\Dominio\Compartido\UsuarioAutenticado;
use App\Http\Controllers\Controller;
use App\Http\Requests\Panel\Usuarios\CambiarContrasenaRequest;
use App\Http\Requests\Panel\Usuarios\IniciarSesionRequest;
use App\Http\Requests\Panel\Usuarios\RecuperarContrasenaRequest;
use App\Http\Requests\Panel\Usuarios\RestablecerContrasenaRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/**
 * Autenticación del panel (`/api/panel/auth/*`, 3.1 y 5.2): sesión de Laravel + CSRF.
 */
class AuthController extends Controller
{
    public function __construct(private readonly AutenticacionServicio $servicio) {}

    public function iniciarSesion(IniciarSesionRequest $request): JsonResponse
    {
        $usuario = $this->servicio->iniciarSesion(
            (string) $request->validated('correo'),
            (string) $request->validated('contrasena'),
            $request->ip(),
        );

        return response()->json(['data' => ['usuario' => $usuario]]);
    }

    public function cerrarSesion(Request $request): Response
    {
        $this->servicio->cerrarSesion($this->idUsuario($request), $request->ip());

        return response()->noContent();
    }

    public function yo(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->servicio->perfil($this->idUsuario($request))]);
    }

    public function cambiarContrasena(CambiarContrasenaRequest $request): Response
    {
        $this->servicio->cambiarContrasena(
            $this->idUsuario($request),
            (string) $request->validated('contrasena_actual'),
            (string) $request->validated('contrasena_nueva'),
            $request->ip(),
        );

        return response()->noContent();
    }

    public function recuperar(RecuperarContrasenaRequest $request): JsonResponse
    {
        $this->servicio->solicitarRecuperacion((string) $request->validated('correo'), $request->ip());

        return response()->json(['data' => [
            'mensaje' => 'Si el correo corresponde a una cuenta activa, recibirá un enlace para restablecer su contraseña.',
        ]], 202);
    }

    public function restablecer(RestablecerContrasenaRequest $request): Response
    {
        $this->servicio->restablecer(
            (string) $request->validated('correo'),
            (string) $request->validated('token'),
            (string) $request->validated('contrasena_nueva'),
            $request->ip(),
        );

        return response()->noContent();
    }

    private function idUsuario(Request $request): int
    {
        /** @var UsuarioAutenticado $usuario */
        $usuario = $request->user();

        return $usuario->idUsuario();
    }
}
