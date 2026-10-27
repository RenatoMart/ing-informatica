<?php

namespace App\Http\Controllers\Api\Panel;

use App\Aplicacion\DocumentosAdmision\DocumentosServicio;
use App\Dominio\Compartido\Paginacion;
use App\Http\Controllers\Controller;
use App\Http\Requests\Panel\DocumentosAdmision\GuardarDocumentoRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/**
 * Panel: documentos oficiales (rol Editor y Revisor, sección 5.2).
 */
class DocumentosController extends Controller
{
    public function __construct(private readonly DocumentosServicio $servicio) {}

    public function index(Request $request): JsonResponse
    {
        $resultado = $this->servicio->listar(
            [
                'tipo' => $request->query('tipo'),
                'estado' => $request->query('estado'),
                'q' => $request->query('q'),
            ],
            Paginacion::desde($request->query('pagina'), $request->query('por_pagina')),
        );

        return response()->json($resultado->aArreglo());
    }

    public function show(int $id): JsonResponse
    {
        return response()->json(['data' => $this->servicio->detalle($id)]);
    }

    public function store(GuardarDocumentoRequest $request): JsonResponse
    {
        $id = $this->servicio->registrar((int) $request->user()?->getAuthIdentifier(), $request->safe()->except('archivo'), $request->file('archivo'));

        return response()->json(['data' => ['id' => $id, 'id_documento' => $id]], 201);
    }

    public function update(GuardarDocumentoRequest $request, int $id): Response
    {
        $this->servicio->actualizar((int) $request->user()?->getAuthIdentifier(), $id, $request->safe()->except('archivo'), $request->file('archivo'));

        return response()->noContent();
    }

    public function reenviar(Request $request, int $id): Response
    {
        $this->servicio->reenviar((int) $request->user()?->getAuthIdentifier(), $id);

        return response()->noContent();
    }
}
