<?php

namespace App\Http\Requests\Panel\Usuarios;

use App\Dominio\Usuarios\EstadoUsuario;
use App\Dominio\Usuarios\Rol;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * `GET /usuarios?estado&rol&q&pagina&por_pagina`.
 */
class ListarUsuariosRequest extends FormRequest
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
            'estado' => ['nullable', Rule::enum(EstadoUsuario::class)],
            'rol' => ['nullable', Rule::enum(Rol::class)],
            'q' => ['nullable', 'string', 'max:100'],
            'pagina' => ['nullable', 'integer', 'min:1'],
            'por_pagina' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }

    /**
     * @return array{estado?: string|null, rol?: string|null, q?: string|null}
     */
    public function filtros(): array
    {
        /** @var array{estado?: string|null, rol?: string|null, q?: string|null} */
        return $this->safe()->only(['estado', 'rol', 'q']);
    }
}
