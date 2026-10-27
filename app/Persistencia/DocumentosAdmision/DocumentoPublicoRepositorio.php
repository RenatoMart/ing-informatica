<?php

namespace App\Persistencia\DocumentosAdmision;

use App\Persistencia\Compartido\Repositorio;

/**
 * Lectura pública de documentos oficiales: solo `v_publico_documentos` (vigentes e históricos).
 */
class DocumentoPublicoRepositorio extends Repositorio
{
    /**
     * @return list<array<string, mixed>>
     */
    public function listar(?string $tipo, bool $incluirHistoricos): array
    {
        $consulta = $this->tabla('v_publico_documentos')
            ->select('id_documento', 'tipo', 'numero', 'titulo', 'fecha_emision', 'fecha_vigencia', 'departamento', 'estado', 'archivo_pdf')
            ->whereIn('estado', $incluirHistoricos ? ['vigente', 'historico'] : ['vigente'])
            ->orderByRaw("CASE WHEN estado = 'vigente' THEN 0 ELSE 1 END")
            ->orderByDesc('fecha_emision')
            ->orderByDesc('id_documento');

        if ($tipo !== null && $tipo !== '') {
            $consulta->where('tipo', $tipo);
        }

        return $this->todas($consulta);
    }
}
