<?php

namespace App\Http\Controllers\Api\Publico;

use App\Aplicacion\Docentes\ConsultaDocentesServicio;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Plana docente y departamentos del sitio público (`/api/publico/docentes`, `/api/publico/departamentos`).
 */
class DocentesPublicosController extends Controller
{
    public function __construct(private readonly ConsultaDocentesServicio $servicio) {}

    public function docentes(Request $request): JsonResponse
    {
        $q = $request->query('q');
        $departamento = $request->query('id_departamento');

        $datos = $this->servicio->listar([
            'id_departamento' => is_numeric($departamento) ? (int) $departamento : null,
            'investigador' => $request->boolean('investigador'),
            'q' => is_string($q) ? $q : null,
        ]);

        return response()->json(['data' => $datos])->header('Cache-Control', 'public, max-age=60');
    }

    public function departamentos(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->servicio->departamentos($request->boolean('con_docentes'))])
            ->header('Cache-Control', 'public, max-age=60');
    }
}
