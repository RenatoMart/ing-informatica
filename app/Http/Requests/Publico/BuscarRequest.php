<?php

namespace App\Http\Requests\Publico;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Query de `GET /api/publico/buscar`.
 */
class BuscarRequest extends FormRequest
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
        return ['q' => ['required', 'string', 'min:3', 'max:100']];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return ['q.required' => 'Escriba qué desea buscar.', 'q.min' => 'Escriba al menos 3 caracteres.', 'q.max' => 'La búsqueda es demasiado larga.'];
    }
}
