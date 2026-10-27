<?php

namespace App\Http\Requests\Panel\Usuarios;

use App\Dominio\Usuarios\AccionBitacora;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * `GET /bitacora?id_usuario&accion&desde&hasta&pagina&por_pagina` (fechas `AAAA-MM-DD`).
 */
class ListarBitacoraRequest extends FormRequest
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
            'id_usuario' => ['nullable', 'integer', 'min:1'],
            'accion' => ['nullable', Rule::enum(AccionBitacora::class)],
            'desde' => ['nullable', 'date_format:Y-m-d'],
            'hasta' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:desde'],
            'pagina' => ['nullable', 'integer', 'min:1'],
            'por_pagina' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }

    /**
     * @return array{id_usuario: int|null, accion: string|null, desde: string|null, hasta: string|null}
     */
    public function filtros(): array
    {
        return [
            'id_usuario' => $this->filled('id_usuario') ? (int) $this->validated('id_usuario') : null,
            'accion' => $this->validated('accion'),
            'desde' => $this->validated('desde'),
            'hasta' => $this->validated('hasta'),
        ];
    }
}
