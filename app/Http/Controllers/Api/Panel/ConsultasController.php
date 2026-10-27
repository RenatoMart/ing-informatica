<?php

namespace App\Http\Controllers\Api\Panel;

use App\Aplicacion\ConsultasVisitas\ConsultasServicio;
use App\Dominio\Compartido\Paginacion;
use App\Http\Controllers\Controller;
use App\Http\Requests\Panel\Consultas\ClasificarConsultaRequest;
use App\Http\Requests\Panel\Consultas\FiltrosConsultasRequest;
use App\Http\Requests\Panel\Consultas\ResponderConsultaRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

/**
 * Consultas de contacto del panel (`/api/panel/consultas`, rol Editor o Revisor).
 */
class ConsultasController extends Controller
{
    public function __construct(private readonly ConsultasServicio $servicio) {}

    public function index(FiltrosConsultasRequest $request): JsonResponse
    {
        $resultado = $this->servicio->listar(
            ['estado' => $request->validated('estado'), 'vencidas' => $request->boolean('vencidas'), 'q' => $request->validated('q')],
            Paginacion::desde($request->validated('pagina'), $request->validated('por_pagina')),
        );

        return response()->json($resultado->aArreglo());
    }

    public function show(int $id): JsonResponse
    {
        return response()->json(['data' => $this->servicio->detalle($id)]);
    }

    public function clasificar(ClasificarConsultaRequest $request, int $id): Response
    {
        $this->servicio->clasificar(
            (int) $request->user()?->getAuthIdentifier(),
            $id,
            $request->validated('destino'),
            $request->validated('id_departamento') === null ? null : (int) $request->validated('id_departamento'),
            $request->validated('nota'),
        );

        return response()->noContent();
    }

    public function responder(ResponderConsultaRequest $request, int $id): Response
    {
        $this->servicio->responder((int) $request->user()?->getAuthIdentifier(), $id, $request->validated('respuesta'));

        return response()->noContent();
    }
}
