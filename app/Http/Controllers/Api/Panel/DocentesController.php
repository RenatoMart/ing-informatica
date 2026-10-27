<?php

namespace App\Http\Controllers\Api\Panel;

use App\Aplicacion\Docentes\DocentesServicio;
use App\Dominio\Compartido\Paginacion;
use App\Dominio\Docentes\Encuadre;
use App\Http\Controllers\Controller;
use App\Http\Requests\Panel\Docentes\EstablecerEncuadreRequest;
use App\Http\Requests\Panel\Docentes\FiltrosDocentesRequest;
use App\Http\Requests\Panel\Docentes\GuardarDocenteRequest;
use App\Http\Requests\Panel\Docentes\SubirFotoDocenteRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/**
 * Panel de docentes (`/api/panel/docentes`, rol Editor o Revisor). Sin lógica: valida y delega.
 */
class DocentesController extends Controller
{
    public function __construct(private readonly DocentesServicio $servicio) {}

    public function index(FiltrosDocentesRequest $request): JsonResponse
    {
        $filtros = $request->safe()->only(['estado', 'id_departamento', 'q']);
        $paginacion = Paginacion::desde($request->query('pagina'), $request->query('por_pagina'));

        return response()->json($this->servicio->listar($filtros, $paginacion)->aArreglo());
    }

    public function show(int $id): JsonResponse
    {
        return response()->json(['data' => $this->servicio->detalle($id)]);
    }

    public function store(GuardarDocenteRequest $request): JsonResponse
    {
        $id = $this->servicio->crear($this->idUsuario($request), $request->validated());

        return response()->json(['data' => ['id_docente' => $id]], 201);
    }

    public function update(GuardarDocenteRequest $request, int $id): JsonResponse
    {
        $modo = $this->servicio->actualizar($this->idUsuario($request), $id, $request->validated());

        return response()->json(['data' => ['modo' => $modo]]);
    }

    public function foto(SubirFotoDocenteRequest $request, int $id): JsonResponse
    {
        $encuadre = $request->filled('encuadre_x') || $request->filled('encuadre_y')
            ? new Encuadre((int) $request->input('encuadre_x', Encuadre::DEFECTO_X), (int) $request->input('encuadre_y', Encuadre::DEFECTO_Y))
            : null;

        $resultado = $this->servicio->establecerFoto($this->idUsuario($request), $id, $request->file('foto'), $encuadre);

        return response()->json(['data' => $resultado]);
    }

    public function encuadre(EstablecerEncuadreRequest $request, int $id): Response
    {
        $this->servicio->establecerEncuadre(
            $this->idUsuario($request), $id,
            new Encuadre((int) $request->validated('encuadre_x'), (int) $request->validated('encuadre_y')),
        );

        return response()->noContent();
    }

    public function enviarRevision(Request $request, int $id): Response
    {
        $this->servicio->enviarRevision($this->idUsuario($request), $id);

        return response()->noContent();
    }

    public function solicitarBaja(Request $request, int $id): Response
    {
        $this->servicio->solicitarBaja($this->idUsuario($request), $id);

        return response()->noContent();
    }

    public function reactivar(Request $request, int $id): Response
    {
        $this->servicio->reactivar($this->idUsuario($request), $id);

        return response()->noContent();
    }

    private function idUsuario(Request $request): int
    {
        return (int) $request->user()?->getAuthIdentifier();
    }
}
