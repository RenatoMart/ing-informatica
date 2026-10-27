<?php

namespace App\Http\Requests\Panel\Docentes;

use App\Dominio\Docentes\EstadoDocente;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Filtros del listado del panel: `estado`, `id_departamento`, `q`, `pagina` y `por_pagina`.
 */
class FiltrosDocentesRequest extends FormRequest
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
            'estado' => ['nullable', Rule::enum(EstadoDocente::class)],
            'id_departamento' => ['nullable', 'integer'],
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
