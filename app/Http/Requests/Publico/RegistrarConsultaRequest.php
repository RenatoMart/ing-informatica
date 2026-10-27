<?php

namespace App\Http\Requests\Publico;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Cuerpo de `POST /api/publico/consultas`. `sitio_web` es un honeypot.
 */
class RegistrarConsultaRequest extends FormRequest
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
        return [
            'nombre' => ['required', 'string', 'min:3', 'max:150'],
            'correo' => ['required', 'email', 'max:150'],
            'asunto' => ['nullable', 'string', 'max:150'],
            'mensaje' => ['required', 'string', 'min:10', 'max:5000'],
            'sitio_web' => ['nullable', 'string', 'max:500'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'nombre.required' => 'Ingrese su nombre.',
            'nombre.min' => 'El nombre debe tener al menos 3 caracteres.',
            'correo.required' => 'Ingrese su correo.',
            'correo.email' => 'El correo no es válido.',
            'mensaje.required' => 'Escriba su mensaje.',
            'mensaje.min' => 'El mensaje debe tener al menos 10 caracteres.',
            'mensaje.max' => 'El mensaje no puede superar 5000 caracteres.',
        ];
    }
}
