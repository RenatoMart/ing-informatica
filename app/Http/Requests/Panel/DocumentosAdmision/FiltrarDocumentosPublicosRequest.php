<?php

namespace App\Http\Requests\Panel\DocumentosAdmision;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Filtros de `GET /api/publico/documentos?tipo&historicos=1`.
 */
class FiltrarDocumentosPublicosRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, ValidationRule|string>>
     */
    public function rules(): array
    {
        return [
            'tipo' => ['nullable', 'string', 'in:resolucion,guia,politica'],
            'historicos' => ['nullable', 'boolean'],
        ];
    }
}
