<?php

namespace App\Http\Controllers\Api\Publico;

use App\Aplicacion\ConsultasVisitas\BusquedaServicio;
use App\Http\Controllers\Controller;
use App\Http\Requests\Publico\BuscarRequest;
use Illuminate\Http\JsonResponse;

/**
 * `GET /api/publico/buscar?q=`: búsqueda en publicaciones, docentes y documentos publicados.
 */
class BusquedaController extends Controller
{
    public function __construct(private readonly BusquedaServicio $servicio) {}

    public function index(BuscarRequest $request): JsonResponse
    {
        return response()->json(['data' => $this->servicio->buscar($request->validated('q'))]);
    }
}
