<?php

namespace App\Http\Requests\Panel\PlanEstudios;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Requeridos de un curso: `{ids_requeridos: int[]}` (puede ser vacío).
 */
class PrerrequisitosRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, list<string>> */
    public function rules(): array
    {
        return [
            'ids_requeridos' => ['present', 'array'],
            'ids_requeridos.*' => ['integer'],
        ];
    }
}
