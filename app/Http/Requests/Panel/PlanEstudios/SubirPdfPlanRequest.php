<?php

namespace App\Http\Requests\Panel\PlanEstudios;

use Illuminate\Foundation\Http\FormRequest;

/**
 * PDF del plan o de la resolución (≤10 MB). `tipo` ∈ plan|resolucion llega en la ruta.
 */
class SubirPdfPlanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, list<string>> */
    public function rules(): array
    {
        return [
            'tipo' => ['required', 'in:plan,resolucion'],
            'archivo' => ['required', 'file', 'mimetypes:application/pdf', 'max:10240'],
        ];
    }

    /** @return array<string, mixed> */
    public function validationData(): array
    {
        return [...$this->all(), 'tipo' => $this->route('tipo')];
    }
}
