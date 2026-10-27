<?php

namespace App\Http\Controllers\Api\Publico;

use App\Aplicacion\PlanEstudios\ConsultaPlanServicio;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

/**
 * Sitio público: planes vigente + histórico y malla (sección 5.3).
 */
class PlanEstudiosPublicoController extends Controller
{
    public function __construct(private readonly ConsultaPlanServicio $servicio) {}

    public function index(): JsonResponse
    {
        return $this->conCache(['data' => $this->servicio->versiones()]);
    }

    public function predeterminado(): JsonResponse
    {
        return $this->conCache(['data' => $this->servicio->predeterminado()]);
    }

    public function show(int $id): JsonResponse
    {
        return $this->conCache(['data' => $this->servicio->malla($id)]);
    }

    /** @param array<string, mixed> $cuerpo */
    private function conCache(array $cuerpo): JsonResponse
    {
        return response()->json($cuerpo)->header('Cache-Control', 'public, max-age=60');
    }
}
