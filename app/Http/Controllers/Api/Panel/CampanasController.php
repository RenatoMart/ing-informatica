<?php

namespace App\Http\Controllers\Api\Panel;

use App\Aplicacion\DocumentosAdmision\AdmisionServicio;
use App\Http\Controllers\Controller;
use App\Http\Requests\Panel\DocumentosAdmision\GuardarCampanaRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/**
 * Panel: campañas de admisión (rol Editor y Revisor, sección 5.2).
 */
class CampanasController extends Controller
{
    public function __construct(private readonly AdmisionServicio $servicio) {}

    public function index(): JsonResponse
    {
        return response()->json(['data' => $this->servicio->listar()]);
    }

    public function show(int $id): JsonResponse
    {
        return response()->json(['data' => $this->servicio->detalle($id)]);
    }

    public function store(GuardarCampanaRequest $request): JsonResponse
    {
        $id = $this->servicio->crear((int) $request->user()?->getAuthIdentifier(), $request->validated());

        return response()->json(['data' => ['id' => $id, 'id_campana' => $id]], 201);
    }

    public function update(GuardarCampanaRequest $request, int $id): Response
    {
        $this->servicio->actualizar((int) $request->user()?->getAuthIdentifier(), $id, $request->validated());

        return response()->noContent();
    }

    public function duplicar(Request $request, int $id): JsonResponse
    {
        $nuevo = $this->servicio->duplicar((int) $request->user()?->getAuthIdentifier(), $id);

        return response()->json(['data' => ['id' => $nuevo, 'id_campana' => $nuevo]], 201);
    }

    public function verificarEnlaces(int $id): JsonResponse
    {
        return response()->json(['data' => $this->servicio->verificarEnlaces($id)]);
    }

    public function validacion(int $id): JsonResponse
    {
        return response()->json(['data' => $this->servicio->validacion($id)]);
    }

    public function enviarRevision(Request $request, int $id): Response
    {
        $this->servicio->enviarRevision((int) $request->user()?->getAuthIdentifier(), $id);

        return response()->noContent();
    }
}
