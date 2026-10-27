<?php

namespace App\Http\Controllers\Api\Publico;

use App\Aplicacion\ConsultasVisitas\VisitasServicio;
use App\Dominio\ConsultasVisitas\SeccionVisita;
use App\Http\Controllers\Controller;
use App\Http\Requests\Publico\RegistrarVisitaRequest;
use Illuminate\Http\Response;

/**
 * `POST /api/publico/visitas`: registro anónimo de visita (204).
 */
class VisitasController extends Controller
{
    public function __construct(private readonly VisitasServicio $servicio) {}

    public function store(RegistrarVisitaRequest $request): Response
    {
        $this->servicio->registrar(SeccionVisita::from($request->validated('seccion')));

        return response()->noContent();
    }
}
