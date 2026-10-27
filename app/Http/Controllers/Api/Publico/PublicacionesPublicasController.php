<?php

namespace App\Http\Controllers\Api\Publico;

use App\Aplicacion\Publicaciones\ConsultaPublicacionesServicio;
use App\Dominio\Compartido\Paginacion;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Publicaciones del sitio público (`/api/publico/publicaciones`): solo `publicada` y ya visible.
 */
class PublicacionesPublicasController extends Controller
{
    public function __construct(private readonly ConsultaPublicacionesServicio $servicio) {}

    public function index(Request $request): JsonResponse
    {
        $categoria = $request->query('categoria');
        $resultado = $this->servicio->listar(
            is_string($categoria) ? $categoria : null,
            Paginacion::desde($request->query('pagina'), $request->query('por_pagina')),
        );

        return response()->json($resultado->aArreglo())->header('Cache-Control', 'public, max-age=60');
    }

    public function show(int $id): JsonResponse
    {
        return response()->json(['data' => $this->servicio->detalle($id)])->header('Cache-Control', 'public, max-age=60');
    }
}
