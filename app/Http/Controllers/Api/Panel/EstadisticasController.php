<?php

namespace App\Http\Controllers\Api\Panel;

use App\Aplicacion\ConsultasVisitas\VisitasServicio;
use App\Http\Controllers\Controller;
use App\Http\Requests\Panel\Consultas\RangoVisitasRequest;
use Illuminate\Http\JsonResponse;

/**
 * Estadísticas de visitas (`GET /api/panel/estadisticas/visitas`, cualquier usuario autenticado).
 */
class EstadisticasController extends Controller
{
    public function __construct(private readonly VisitasServicio $servicio) {}

    public function visitas(RangoVisitasRequest $request): JsonResponse
    {
        return response()->json(['data' => $this->servicio->estadisticas($request->validated('desde'), $request->validated('hasta'))]);
    }
}
