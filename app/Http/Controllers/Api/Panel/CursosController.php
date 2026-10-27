<?php

namespace App\Http\Controllers\Api\Panel;

use App\Aplicacion\PlanEstudios\CursosServicio;
use App\Http\Controllers\Controller;
use App\Http\Requests\Panel\PlanEstudios\GuardarCursoRequest;
use App\Http\Requests\Panel\PlanEstudios\ImportarCursosRequest;
use App\Http\Requests\Panel\PlanEstudios\PrerrequisitosRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/**
 * Panel: cursos y prerrequisitos de un plan (sección 5.2).
 */
class CursosController extends Controller
{
    public function __construct(private readonly CursosServicio $servicio) {}

    public function store(GuardarCursoRequest $request, int $id): JsonResponse
    {
        return response()->json(
            ['data' => $this->servicio->crear($this->idUsuario($request), $id, $request->validated())],
            201,
        );
    }

    public function importar(ImportarCursosRequest $request, int $id): JsonResponse
    {
        return response()->json(
            ['data' => $this->servicio->importar($this->idUsuario($request), $id, array_values($request->validated('cursos')))],
        );
    }

    public function update(GuardarCursoRequest $request, int $id): Response
    {
        $this->servicio->actualizar($this->idUsuario($request), $id, $request->validated());

        return response()->noContent();
    }

    public function destroy(Request $request, int $id): Response
    {
        $this->servicio->eliminar($this->idUsuario($request), $id);

        return response()->noContent();
    }

    public function prerrequisitos(PrerrequisitosRequest $request, int $id): Response
    {
        $this->servicio->establecerPrerrequisitos(
            $this->idUsuario($request),
            $id,
            array_map('intval', $request->validated('ids_requeridos')),
        );

        return response()->noContent();
    }

    private function idUsuario(Request $request): int
    {
        return $request->user()->idUsuario();
    }
}
