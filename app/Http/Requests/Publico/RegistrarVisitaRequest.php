<?php

namespace App\Http\Requests\Publico;

use App\Dominio\ConsultasVisitas\SeccionVisita;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Cuerpo de `POST /api/publico/visitas`.
 */
class RegistrarVisitaRequest extends FormRequest
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
        return ['seccion' => ['required', Rule::enum(SeccionVisita::class)]];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return ['seccion.required' => 'Indique la sección.', 'seccion.enum' => 'La sección no es válida.'];
    }
}
