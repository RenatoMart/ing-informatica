<?php

namespace App\Http\Requests\Panel\DocumentosAdmision;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Alta (`POST /documentos`, PDF obligatorio) y edición (`PUT /documentos/{id}`, PDF opcional) de un documento oficial.
 */
class GuardarDocumentoRequest extends FormRequest
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
        $esAlta = $this->route('id') === null;

        return [
            'tipo' => ['required', 'string', 'in:resolucion,guia,politica'],
            'numero' => ['required', 'string', 'max:50'],
            'titulo' => ['required', 'string', 'max:200'],
            'fecha_emision' => ['required', 'date_format:Y-m-d'],
            'id_departamento_emisor' => ['required', 'integer', 'exists:departamento,id_departamento'],
            'fecha_vigencia' => ['required', 'date_format:Y-m-d', 'after_or_equal:fecha_emision'],
            'id_version_anterior' => ['nullable', 'integer'],
            'archivo' => [$esAlta ? 'required' : 'nullable', 'file', 'mimetypes:application/pdf', 'max:'.(int) config('portal.pdf.max_kb', 10240)],
        ];
    }
}
