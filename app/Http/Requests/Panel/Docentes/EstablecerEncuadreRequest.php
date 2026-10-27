<?php

namespace App\Http\Requests\Panel\Docentes;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Encuadre de la foto: `encuadre_x` y `encuadre_y` como porcentajes (0–100).
 */
class EstablecerEncuadreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, list<string>>
     */
    public function rules(): array
    {
        return [
            'encuadre_x' => ['required', 'integer', 'between:0,100'],
            'encuadre_y' => ['required', 'integer', 'between:0,100'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'encuadre_x.required' => 'El encuadre horizontal es obligatorio.',
            'encuadre_y.required' => 'El encuadre vertical es obligatorio.',
            'encuadre_x.between' => 'El encuadre horizontal debe estar entre 0 y 100.',
            'encuadre_y.between' => 'El encuadre vertical debe estar entre 0 y 100.',
            'encuadre_x.integer' => 'El encuadre horizontal debe ser un número entero.',
            'encuadre_y.integer' => 'El encuadre vertical debe ser un número entero.',
        ];
    }
}
