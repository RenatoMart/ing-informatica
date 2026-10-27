<?php

namespace App\Http\Requests\Panel\PlanEstudios;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Importación masiva: `{cursos: [...]}` (1 a 120). Cada fila se valida en el Dominio (`cursos[i].campo`).
 */
class ImportarCursosRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, list<string>> */
    public function rules(): array
    {
        return [
            'cursos' => ['required', 'array', 'min:1', 'max:120'],
            'cursos.*' => ['array'],
        ];
    }
}
