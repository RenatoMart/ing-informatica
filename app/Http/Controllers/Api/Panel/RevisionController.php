<?php

namespace App\Http\Controllers\Api\Panel;

use App\Aplicacion\Revision\RevisionServicio;
use App\Dominio\Compartido\Excepciones\NoEncontradoException;
use App\Dominio\Revision\EntidadRevisable;
use App\Dominio\Revision\TipoDecision;
use App\Http\Controllers\Controller;
use App\Http\Requests\Panel\Revision\DecidirRevisionRequest;
use Illuminate\Http\JsonResponse;

/**
 * Revisión común (`/api/panel/revision/...`): bandeja, decisión e historial de las cinco entidades.
 */
class RevisionController extends Controller
{
    public function __construct(private readonly RevisionServicio $servicio) {}

    public function pendientes(): JsonResponse
    {
        return response()->json(['data' => $this->servicio->pendientes()]);
    }

    public function decidir(DecidirRevisionRequest $request, string $entidad, int $id): JsonResponse
    {
        $estado = $this->servicio->decidir(
            $this->entidad($entidad),
            $id,
            (int) $request->user()?->getAuthIdentifier(),
            TipoDecision::from($request->validated('decision')),
            $request->validated('observaciones'),
            $request->has('como_vigente') ? $request->boolean('como_vigente') : null,
        );

        return response()->json(['data' => ['estado' => $estado]]);
    }

    public function historial(string $entidad, int $id): JsonResponse
    {
        return response()->json(['data' => $this->servicio->historial($this->entidad($entidad), $id)]);
    }

    private function entidad(string $valor): EntidadRevisable
    {
        return EntidadRevisable::tryFrom($valor) ?? throw new NoEncontradoException('Entidad no encontrada.');
    }
}
