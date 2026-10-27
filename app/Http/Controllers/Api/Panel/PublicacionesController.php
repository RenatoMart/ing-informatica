<?php

namespace App\Http\Controllers\Api\Panel;

use App\Aplicacion\Publicaciones\PublicacionesServicio;
use App\Dominio\Compartido\Paginacion;
use App\Http\Controllers\Controller;
use App\Http\Requests\Panel\Publicaciones\FiltrosPublicacionesRequest;
use App\Http\Requests\Panel\Publicaciones\GuardarPublicacionRequest;
use App\Http\Requests\Panel\Publicaciones\SubirImagenPublicacionRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/**
 * Panel de publicaciones (`/api/panel/publicaciones`, rol Editor o Revisor). Sin lógica: valida y delega.
 */
class PublicacionesController extends Controller
{
    public function __construct(private readonly PublicacionesServicio $servicio) {}

    public function index(FiltrosPublicacionesRequest $request): JsonResponse
    {
        $filtros = $request->safe()->only(['estado', 'categoria', 'q']);
        $paginacion = Paginacion::desde($request->query('pagina'), $request->query('por_pagina'));

        return response()->json($this->servicio->listar($filtros, $paginacion)->aArreglo());
    }

    public function show(int $id): JsonResponse
    {
        return response()->json(['data' => $this->servicio->detalle($id)]);
    }

    public function store(GuardarPublicacionRequest $request): JsonResponse
    {
        $id = $this->servicio->crear($this->idUsuario($request), $request->validated());

        return response()->json(['data' => ['id_publicacion' => $id]], 201);
    }

    public function update(GuardarPublicacionRequest $request, int $id): JsonResponse
    {
        $modo = $this->servicio->actualizar($this->idUsuario($request), $id, $request->validated());

        return response()->json(['data' => ['modo' => $modo]]);
    }

    public function subirImagen(SubirImagenPublicacionRequest $request, int $id): JsonResponse
    {
        $resultado = $this->servicio->subirImagen($this->idUsuario($request), $id, $request->file('imagen'));

        return response()->json(['data' => $resultado], 201);
    }

    public function quitarImagen(Request $request, int $id, int $idArchivo): Response
    {
        $this->servicio->quitarImagen($this->idUsuario($request), $id, $idArchivo);

        return response()->noContent();
    }

    public function enviarRevision(Request $request, int $id): Response
    {
        $this->servicio->enviarRevision($this->idUsuario($request), $id);

        return response()->noContent();
    }

    public function solicitarBaja(Request $request, int $id): Response
    {
        $this->servicio->solicitarBaja($this->idUsuario($request), $id);

        return response()->noContent();
    }

    public function descartar(Request $request, int $id): Response
    {
        $this->servicio->descartar($this->idUsuario($request), $id);

        return response()->noContent();
    }

    private function idUsuario(Request $request): int
    {
        return (int) $request->user()?->getAuthIdentifier();
    }
}
