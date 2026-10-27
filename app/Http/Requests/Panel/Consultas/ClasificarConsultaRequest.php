<?php

namespace App\Http\Requests\Panel\Consultas;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Cuerpo de `POST /consultas/{id}/clasificar`.
 */
class ClasificarConsultaRequest extends FormRequest
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
            'destino' => ['required', Rule::in(['area', 'externa', 'descartar'])],
            'id_departamento' => ['nullable', 'integer', 'required_if:destino,area'],
            'nota' => ['nullable', 'string', 'max:5000', 'required_if:destino,externa'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'destino.required' => 'Indique el destino de la consulta.',
            'destino.in' => 'El destino debe ser área, externa o descartar.',
            'id_departamento.required_if' => 'Seleccione el departamento responsable.',
            'nota.required_if' => 'Indique el canal adecuado para el visitante.',
        ];
    }
}
