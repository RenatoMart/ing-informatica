<?php

namespace App\Http\Requests\Panel\Consultas;

use App\Dominio\ConsultasVisitas\EstadoConsulta;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Filtros de `GET /consultas`.
 */
class FiltrosConsultasRequest extends FormRequest
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
            'estado' => ['nullable', Rule::enum(EstadoConsulta::class)],
            'vencidas' => ['nullable', 'boolean'],
            'q' => ['nullable', 'string', 'max:200'],
            'pagina' => ['nullable', 'integer', 'min:1'],
            'por_pagina' => ['nullable', 'integer', 'min:1'],
        ];
    }
}
