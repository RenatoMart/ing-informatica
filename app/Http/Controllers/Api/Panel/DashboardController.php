<?php

namespace App\Http\Controllers\Api\Panel;

use App\Aplicacion\ConsultasVisitas\DashboardServicio;
use App\Dominio\Compartido\UsuarioAutenticado;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * KPIs y pendientes del inicio del panel (`GET /api/panel/dashboard`), según el rol.
 */
class DashboardController extends Controller
{
    public function __construct(private readonly DashboardServicio $servicio) {}

    public function __invoke(Request $request): JsonResponse
    {
        $usuario = $request->user();
        abort_unless($usuario instanceof UsuarioAutenticado, 401);

        return response()->json(['data' => $this->servicio->paraRol($usuario->nombreRol(), $usuario->idUsuario())]);
    }
}
