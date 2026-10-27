<?php

namespace App\Http\Controllers\Api\Panel;

use App\Aplicacion\Usuarios\SolicitudesAccesoServicio;
use App\Dominio\Compartido\Paginacion;
use App\Dominio\Compartido\UsuarioAutenticado;
use App\Http\Controllers\Controller;
use App\Http\Requests\Panel\Usuarios\AutorizarSolicitudRequest;
use App\Http\Requests\Panel\Usuarios\DenegarSolicitudRequest;
use App\Http\Requests\Panel\Usuarios\ListarSolicitudesRequest;
use App\Http\Requests\Panel\Usuarios\RegistrarSolicitudRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/**
 * Solicitudes de acceso (`/api/panel/solicitudes`): registran Administrador y Revisor; resuelve el Revisor.
 */
class SolicitudesController extends Controller
{
    public function __construct(private readonly SolicitudesAccesoServicio $servicio) {}

    public function index(ListarSolicitudesRequest $request): JsonResponse
    {
        $paginacion = Paginacion::desde($request->query('pagina'), $request->query('por_pagina'));

        return response()->json($this->servicio->listar($this->idUsuario($request), $request->filtros(), $paginacion)->aArreglo());
    }

    public function store(RegistrarSolicitudRequest $request): JsonResponse
    {
        $id = $this->servicio->registrar($this->idUsuario($request), $request->datos());

        return response()->json(['data' => ['id_solicitud' => $id]], 201);
    }

    public function autorizar(AutorizarSolicitudRequest $request, int $id): Response
    {
        $this->servicio->autorizar($this->idUsuario($request), $id, $request->validated('observacion'));

        return response()->noContent();
    }

    public function denegar(DenegarSolicitudRequest $request, int $id): Response
    {
        $this->servicio->denegar($this->idUsuario($request), $id, (string) $request->validated('observacion'));

        return response()->noContent();
    }

    private function idUsuario(Request $request): int
    {
        /** @var UsuarioAutenticado $usuario */
        $usuario = $request->user();

        return $usuario->idUsuario();
    }
}
