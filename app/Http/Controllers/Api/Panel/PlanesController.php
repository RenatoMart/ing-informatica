<?php

namespace App\Http\Controllers\Api\Panel;

use App\Aplicacion\PlanEstudios\PlanEstudiosServicio;
use App\Http\Controllers\Controller;
use App\Http\Requests\Panel\PlanEstudios\DuplicarPlanRequest;
use App\Http\Requests\Panel\PlanEstudios\GuardarPlanRequest;
use App\Http\Requests\Panel\PlanEstudios\SubirPdfPlanRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/**
 * Panel: versiones del plan de estudios (sección 5.2).
 */
class PlanesController extends Controller
{
    public function __construct(private readonly PlanEstudiosServicio $servicio) {}

    public function index(): JsonResponse
    {
        return response()->json(['data' => $this->servicio->listar()]);
    }

    public function store(GuardarPlanRequest $request): JsonResponse
    {
        $datos = $request->validated();

        return response()->json(
            ['data' => $this->servicio->crear($this->idUsuario($request), (int) $datos['anio'], (string) $datos['version'])],
            201,
        );
    }

    public function show(int $id): JsonResponse
    {
        return response()->json(['data' => $this->servicio->detalle($id)]);
    }

    public function update(GuardarPlanRequest $request, int $id): Response
    {
        $datos = $request->validated();
        $this->servicio->actualizar($this->idUsuario($request), $id, (int) $datos['anio'], (string) $datos['version']);

        return response()->noContent();
    }

    public function duplicar(DuplicarPlanRequest $request, int $id): JsonResponse
    {
        return response()->json(
            ['data' => $this->servicio->duplicar($this->idUsuario($request), $id, (string) $request->validated('version'))],
            201,
        );
    }

    public function subirPdf(SubirPdfPlanRequest $request, int $id, string $tipo): JsonResponse
    {
        return response()->json(
            ['data' => $this->servicio->subirPdf($this->idUsuario($request), $id, $tipo, $request->file('archivo'))],
        );
    }

    public function validacion(int $id): JsonResponse
    {
        return response()->json(['data' => $this->servicio->validar($id)]);
    }

    public function enviarRevision(Request $request, int $id): Response
    {
        $this->servicio->enviarRevision($this->idUsuario($request), $id);

        return response()->noContent();
    }

    public function predeterminado(Request $request, int $id): Response
    {
        $this->servicio->establecerPredeterminado($this->idUsuario($request), $id);

        return response()->noContent();
    }

    private function idUsuario(Request $request): int
    {
        return $request->user()->idUsuario();
    }
}
