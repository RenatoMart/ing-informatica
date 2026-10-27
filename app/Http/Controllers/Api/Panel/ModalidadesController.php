<?php

namespace App\Http\Controllers\Api\Panel;

use App\Aplicacion\DocumentosAdmision\AdmisionServicio;
use App\Http\Controllers\Controller;
use App\Http\Requests\Panel\DocumentosAdmision\GuardarModalidadRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/**
 * Panel: modalidades de ingreso de una campaña en borrador (rol Editor y Revisor).
 */
class ModalidadesController extends Controller
{
    public function __construct(private readonly AdmisionServicio $servicio) {}

    public function store(GuardarModalidadRequest $request, int $id): JsonResponse
    {
        $nueva = $this->servicio->agregarModalidad((int) $request->user()?->getAuthIdentifier(), $id, $request->validated());

        return response()->json(['data' => ['id' => $nueva, 'id_modalidad' => $nueva]], 201);
    }

    public function update(GuardarModalidadRequest $request, int $id): Response
    {
        $this->servicio->actualizarModalidad((int) $request->user()?->getAuthIdentifier(), $id, $request->validated());

        return response()->noContent();
    }

    public function destroy(Request $request, int $id): Response
    {
        $this->servicio->eliminarModalidad((int) $request->user()?->getAuthIdentifier(), $id);

        return response()->noContent();
    }
}
