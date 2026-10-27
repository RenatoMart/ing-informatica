<?php

namespace App\Http\Requests\Panel\Revision;

use App\Dominio\Revision\TipoDecision;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Cuerpo de `POST /revision/{entidad}/{id}/decidir`. `como_vigente` es obligatorio al aprobar un plan.
 */
class DecidirRevisionRequest extends FormRequest
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
            'decision' => ['required', Rule::enum(TipoDecision::class)],
            'observaciones' => ['nullable', 'string', 'max:500'],
            'como_vigente' => [
                Rule::requiredIf(fn (): bool => $this->route('entidad') === 'plan' && $this->input('decision') === 'aprobar'),
                'nullable',
                'boolean',
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'decision.required' => 'Indique la decisión.',
            'decision.enum' => 'La decisión debe ser aprobar, observar o descartar.',
            'observaciones.max' => 'Las observaciones no pueden superar 500 caracteres.',
            'como_vigente.required' => 'Indique si el plan se aprueba como vigente.',
        ];
    }
}
