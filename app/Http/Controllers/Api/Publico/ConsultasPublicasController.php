<?php

namespace App\Http\Controllers\Api\Publico;

use App\Aplicacion\ConsultasVisitas\ConsultasServicio;
use App\Http\Controllers\Controller;
use App\Http\Requests\Publico\RegistrarConsultaRequest;
use Illuminate\Http\JsonResponse;

/**
 * `POST /api/publico/consultas`: registra la consulta y envía el acuse de recibo.
 */
class ConsultasPublicasController extends Controller
{
    private const MENSAJE = 'Recibimos tu consulta. Te enviamos un acuse a tu correo.';

    public function __construct(private readonly ConsultasServicio $servicio) {}

    public function store(RegistrarConsultaRequest $request): JsonResponse
    {
        // Honeypot: un bot rellena `sitio_web`; se responde igual sin guardar nada.
        if (filled($request->validated('sitio_web'))) {
            return response()->json(['data' => ['id_consulta' => 0, 'mensaje' => self::MENSAJE]], 201);
        }

        $id = $this->servicio->registrar(
            $request->validated('nombre'),
            $request->validated('correo'),
            $request->validated('asunto'),
            $request->validated('mensaje'),
        );

        return response()->json(['data' => ['id_consulta' => $id, 'mensaje' => self::MENSAJE]], 201);
    }
}
