<?php

namespace App\Http\Requests\Panel\Usuarios;

use App\Dominio\Usuarios\PoliticaContrasena;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

/**
 * `POST /auth/restablecer`: `{correo, token, contrasena_nueva, contrasena_nueva_confirmation}`.
 */
class RestablecerContrasenaRequest extends FormRequest
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
            'correo' => ['required', 'string', 'email', 'max:150'],
            'token' => ['required', 'string', 'max:128'],
            'contrasena_nueva' => ['required', 'string', 'min:'.PoliticaContrasena::LONGITUD_MINIMA, 'max:'.PoliticaContrasena::LONGITUD_MAXIMA, 'confirmed'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'correo' => 'correo institucional',
            'token' => 'enlace de recuperación',
            'contrasena_nueva' => 'nueva contraseña',
            'contrasena_nueva_confirmation' => 'confirmación de la contraseña',
        ];
    }
}
