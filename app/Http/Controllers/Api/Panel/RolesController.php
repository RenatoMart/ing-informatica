<?php

namespace App\Http\Controllers\Api\Panel;

use App\Aplicacion\Usuarios\GestionUsuariosServicio;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

/**
 * Roles (`GET /api/panel/roles`, cualquier usuario autenticado).
 */
class RolesController extends Controller
{
    public function __construct(private readonly GestionUsuariosServicio $servicio) {}

    public function index(): JsonResponse
    {
        return response()->json(['data' => $this->servicio->roles()]);
    }
}
