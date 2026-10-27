<?php

namespace App\Http\Requests\Panel\DocumentosAdmision;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Modalidad de ingreso de una campaña (vacantes mayores que cero).
 */
class GuardarModalidadRequest extends FormRequest
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
            'nombre' => ['required', 'string', 'max:100'],
            'dirigido_a' => ['nullable', 'string', 'max:150'],
            'vacantes' => ['required', 'integer', 'min:1'],
            'descripcion' => ['nullable', 'string', 'max:5000'],
        ];
    }
}
