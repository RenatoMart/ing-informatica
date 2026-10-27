<?php

namespace App\Http\Controllers\Api\Publico;

use App\Aplicacion\DocumentosAdmision\DocumentosServicio;
use App\Http\Controllers\Controller;
use App\Http\Requests\Panel\DocumentosAdmision\FiltrarDocumentosPublicosRequest;
use Illuminate\Http\JsonResponse;

/**
 * Sitio público: documentos oficiales vigentes (y, con `?historicos=1`, históricos), sección 5.3.
 */
class DocumentosPublicosController extends Controller
{
    public function __construct(private readonly DocumentosServicio $servicio) {}

    public function index(FiltrarDocumentosPublicosRequest $request): JsonResponse
    {
        $documentos = $this->servicio->publicos(
            $request->validated('tipo'),
            $request->boolean('historicos'),
        );

        return response()->json(['data' => $documentos])->header('Cache-Control', 'public, max-age=60');
    }
}
