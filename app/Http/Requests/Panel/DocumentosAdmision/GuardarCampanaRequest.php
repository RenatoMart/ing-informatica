<?php

namespace App\Http\Requests\Panel\DocumentosAdmision;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Cabecera de la campaña de admisión (`POST /campanas`, `PUT /campanas/{id}`).
 */
class GuardarCampanaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, ValidationRule|string>>
     */
    public function rules(): array
    {
        return [
            'anio' => ['required', 'integer', 'between:2000,2100'],
            'proceso' => ['nullable', 'string', 'max:50'],
            'fecha_inicio' => ['nullable', 'date_format:Y-m-d'],
            'fecha_fin' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:fecha_inicio'],
            'url_portal' => ['nullable', 'string', 'max:255', 'url:https'],
            'url_estadisticas' => ['nullable', 'string', 'max:255', 'url:https'],
        ];
    }
}
