<?php

namespace App\Http\Requests\Panel\Usuarios;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

/**
 * `POST /solicitudes/{id}/autorizar`: `{observacion?}`.
 */
class AutorizarSolicitudRequest extends FormRequest
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
            'observacion' => ['nullable', 'string', 'max:255'],
        ];
    }
}
