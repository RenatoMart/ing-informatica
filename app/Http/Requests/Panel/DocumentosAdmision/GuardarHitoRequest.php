<?php

namespace App\Http\Requests\Panel\DocumentosAdmision;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Hito del cronograma de la campaña (la fecha cae dentro de [inicio, fin]; lo comprueba el dominio).
 */
class GuardarHitoRequest extends FormRequest
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
            'hito' => ['required', 'string', 'max:150'],
            'fecha' => ['required', 'date_format:Y-m-d'],
        ];
    }
}
