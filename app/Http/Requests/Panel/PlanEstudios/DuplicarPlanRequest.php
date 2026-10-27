<?php

namespace App\Http\Requests\Panel\PlanEstudios;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Duplicar una versión: `{version}` de la copia.
 */
class DuplicarPlanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, list<string>> */
    public function rules(): array
    {
        return ['version' => ['required', 'string', 'max:20']];
    }
}
