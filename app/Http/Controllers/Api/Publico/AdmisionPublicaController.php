<?php

namespace App\Http\Controllers\Api\Publico;

use App\Aplicacion\DocumentosAdmision\AdmisionServicio;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

/**
 * Sitio público: campaña de admisión vigente con modalidades y cronograma (sección 5.3).
 * Sin campaña vigente responde 404 `SIN_CAMPANA_VIGENTE`.
 */
class AdmisionPublicaController extends Controller
{
    public function __construct(private readonly AdmisionServicio $servicio) {}

    public function show(): JsonResponse
    {
        return response()->json(['data' => $this->servicio->publica()])->header('Cache-Control', 'public, max-age=60');
    }
}
