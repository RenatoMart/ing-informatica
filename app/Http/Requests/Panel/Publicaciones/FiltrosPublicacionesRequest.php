<?php

namespace App\Http\Requests\Panel\Publicaciones;

use App\Dominio\Publicaciones\EstadoPublicacion;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Filtros del listado del panel: `estado`, `categoria`, `q`, `pagina` y `por_pagina`.
 */
class FiltrosPublicacionesRequest extends FormRequest
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
            'estado' => ['nullable', Rule::enum(EstadoPublicacion::class)],
            'categoria' => ['nullable', 'string', 'max:100'],
            'q' => ['nullable', 'string', 'max:200'],
            'pagina' => ['nullable', 'integer', 'min:1'],
            'por_pagina' => ['nullable', 'integer', 'min:1'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return ['estado.enum' => 'El estado indicado no es válido.'];
    }
}
