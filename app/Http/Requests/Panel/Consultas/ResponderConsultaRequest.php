<?php

namespace App\Http\Requests\Panel\Consultas;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Cuerpo de `POST /consultas/{id}/responder`.
 */
class ResponderConsultaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, list<mixed>>
     */
    public function rules(): array
    {
        return ['respuesta' => ['required', 'string', 'min:10', 'max:5000']];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'respuesta.required' => 'Escriba la respuesta.',
            'respuesta.min' => 'La respuesta debe tener al menos 10 caracteres.',
            'respuesta.max' => 'La respuesta no puede superar 5000 caracteres.',
        ];
    }
}
