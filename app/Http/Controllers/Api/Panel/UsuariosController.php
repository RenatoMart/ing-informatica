<?php

namespace App\Http\Controllers\Api\Panel;

use App\Aplicacion\Usuarios\GestionUsuariosServicio;
use App\Dominio\Compartido\Paginacion;
use App\Dominio\Compartido\UsuarioAutenticado;
use App\Http\Controllers\Controller;
use App\Http\Requests\Panel\Usuarios\ActualizarUsuarioRequest;
use App\Http\Requests\Panel\Usuarios\CrearUsuarioRequest;
use App\Http\Requests\Panel\Usuarios\EjecutarSolicitudRequest;
use App\Http\Requests\Panel\Usuarios\ListarUsuariosRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/**
 * Usuarios (`/api/panel/usuarios`): lectura para Administrador y Revisor; escrituras solo Administrador
 * y siempre con una solicitud autorizada. Nunca se elimina un usuario: la baja lo desactiva.
 */
class UsuariosController extends Controller
{
    public function __construct(private readonly GestionUsuariosServicio $servicio) {}

    public function index(ListarUsuariosRequest $request): JsonResponse
    {
        $paginacion = Paginacion::desde($request->query('pagina'), $request->query('por_pagina'));

        return response()->json($this->servicio->listar($this->idUsuario($request), $request->filtros(), $paginacion)->aArreglo());
    }

    public function show(Request $request, int $id): JsonResponse
    {
        return response()->json(['data' => $this->servicio->ver($this->idUsuario($request), $id)]);
    }

    public function store(CrearUsuarioRequest $request): JsonResponse
    {
        $id = $this->servicio->crearDesdeSolicitud(
            $this->idUsuario($request),
            (int) $request->validated('id_solicitud'),
            (string) $request->validated('nombres'),
            (string) $request->validated('apellidos'),
            $request->validated('cargo'),
        );

        return response()->json(['data' => ['id_usuario' => $id]], 201);
    }

    public function update(ActualizarUsuarioRequest $request, int $id): Response
    {
        $this->servicio->actualizarDatos(
            $this->idUsuario($request),
            $id,
            (string) $request->validated('nombres'),
            (string) $request->validated('apellidos'),
            $request->validated('cargo'),
        );

        return response()->noContent();
    }

    public function cambiarRol(EjecutarSolicitudRequest $request, int $id): Response
    {
        $this->servicio->cambiarRol($this->idUsuario($request), $id, (int) $request->validated('id_solicitud'));

        return response()->noContent();
    }

    public function desactivar(EjecutarSolicitudRequest $request, int $id): Response
    {
        $this->servicio->desactivar($this->idUsuario($request), $id, (int) $request->validated('id_solicitud'), $request->ip());

        return response()->noContent();
    }

    private function idUsuario(Request $request): int
    {
        /** @var UsuarioAutenticado $usuario */
        $usuario = $request->user();

        return $usuario->idUsuario();
    }
}
