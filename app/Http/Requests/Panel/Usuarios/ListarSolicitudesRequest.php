<?php

namespace App\Http\Requests\Panel\Usuarios;

use App\Dominio\Usuarios\EstadoSolicitud;
use App\Dominio\Usuarios\TipoSolicitud;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * `GET /solicitudes?estado&tipo&pagina&por_pagina`.
 */
class ListarSolicitudesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'estado' => ['nullable', Rule::enum(EstadoSolicitud::class)],
            'tipo' => ['nullable', Rule::enum(TipoSolicitud::class)],
            'pagina' => ['nullable', 'integer', 'min:1'],
            'por_pagina' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }

    /**
     * @return array{estado?: string|null, tipo?: string|null}
     */
    public function filtros(): array
    {
        /** @var array{estado?: string|null, tipo?: string|null} */
        return $this->safe()->only(['estado', 'tipo']);
    }
}
