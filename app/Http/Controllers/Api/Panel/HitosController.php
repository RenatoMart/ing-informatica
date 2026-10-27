<?php

namespace App\Http\Controllers\Api\Panel;

use App\Aplicacion\DocumentosAdmision\AdmisionServicio;
use App\Http\Controllers\Controller;
use App\Http\Requests\Panel\DocumentosAdmision\GuardarHitoRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/**
 * Panel: hitos del cronograma de una campaña en borrador (rol Editor y Revisor).
 */
class HitosController extends Controller
{
    public function __construct(private readonly AdmisionServicio $servicio) {}

    public function store(GuardarHitoRequest $request, int $id): JsonResponse
    {
        $nuevo = $this->servicio->agregarHito((int) $request->user()?->getAuthIdentifier(), $id, $request->validated());

        return response()->json(['data' => ['id' => $nuevo, 'id_hito' => $nuevo]], 201);
    }

    public function update(GuardarHitoRequest $request, int $id): Response
    {
        $this->servicio->actualizarHito((int) $request->user()?->getAuthIdentifier(), $id, $request->validated());

        return response()->noContent();
    }

    public function destroy(Request $request, int $id): Response
    {
        $this->servicio->eliminarHito((int) $request->user()?->getAuthIdentifier(), $id);

        return response()->noContent();
    }
}
