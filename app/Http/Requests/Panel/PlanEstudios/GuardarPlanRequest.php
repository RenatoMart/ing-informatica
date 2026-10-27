<?php

namespace App\Http\Requests\Panel\PlanEstudios;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Crear o actualizar una versión del plan: `{anio, version}`.
 */
class GuardarPlanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, list<string>> */
    public function rules(): array
    {
        return [
            'anio' => ['required', 'integer', 'between:2000,2100'],
            'version' => ['required', 'string', 'max:20'],
        ];
    }
}
