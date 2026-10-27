<?php

namespace App\Http\Controllers\Api\Panel;

use App\Aplicacion\Docentes\DepartamentosServicio;
use App\Http\Controllers\Controller;
use App\Http\Requests\Panel\Docentes\GuardarDepartamentoRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

/**
 * Departamentos del panel (`/api/panel/departamentos`, rol Editor o Revisor).
 */
class DepartamentosController extends Controller
{
    public function __construct(private readonly DepartamentosServicio $servicio) {}

    public function index(): JsonResponse
    {
        return response()->json(['data' => $this->servicio->listar()]);
    }

    public function store(GuardarDepartamentoRequest $request): JsonResponse
    {
        $id = $this->servicio->crear((int) $request->user()?->getAuthIdentifier(), $request->validated('nombre'), $request->validated('correo'));

        return response()->json(['data' => ['id_departamento' => $id]], 201);
    }

    public function update(GuardarDepartamentoRequest $request, int $id): Response
    {
        $this->servicio->actualizar((int) $request->user()?->getAuthIdentifier(), $id, $request->validated('nombre'), $request->validated('correo'));

        return response()->noContent();
    }
}
