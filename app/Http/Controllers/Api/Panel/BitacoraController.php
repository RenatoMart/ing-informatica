<?php

namespace App\Http\Controllers\Api\Panel;

use App\Aplicacion\Usuarios\BitacoraServicio;
use App\Dominio\Compartido\Paginacion;
use App\Dominio\Compartido\UsuarioAutenticado;
use App\Http\Controllers\Controller;
use App\Http\Requests\Panel\Usuarios\ListarBitacoraRequest;
use Illuminate\Http\JsonResponse;

/**
 * Bitácora de accesos (`GET /api/panel/bitacora`, Administrador y Revisor).
 */
class BitacoraController extends Controller
{
    public function __construct(private readonly BitacoraServicio $servicio) {}

    public function index(ListarBitacoraRequest $request): JsonResponse
    {
        /** @var UsuarioAutenticado $usuario */
        $usuario = $request->user();
        $paginacion = Paginacion::desde($request->query('pagina'), $request->query('por_pagina'));

        return response()->json($this->servicio->listar($usuario->idUsuario(), $request->filtros(), $paginacion)->aArreglo());
    }
}
