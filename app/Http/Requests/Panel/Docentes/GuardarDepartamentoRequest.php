<?php

namespace App\Http\Requests\Panel\Docentes;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Departamento (alta y edición): `nombre` y `correo` opcional.
 */
class GuardarDepartamentoRequest extends FormRequest
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
            'nombre' => ['required', 'string', 'max:150'],
            'correo' => ['nullable', 'string', 'email', 'max:150'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'nombre.required' => 'El nombre del departamento es obligatorio.',
            'nombre.max' => 'El nombre no puede superar 150 caracteres.',
            'correo.email' => 'El correo no es válido.',
            'correo.max' => 'El correo no puede superar 150 caracteres.',
        ];
    }
}
