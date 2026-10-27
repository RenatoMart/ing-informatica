<?php

namespace App\Http\Requests\Panel\Usuarios;

use App\Dominio\Usuarios\PoliticaContrasena;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

/**
 * `POST /auth/cambiar-contrasena`. El resto de la política (letra y dígito, distinta del correo
 * y de la actual) la aplica `PoliticaContrasena` en el Dominio.
 */
class CambiarContrasenaRequest extends FormRequest
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
            'contrasena_actual' => ['required', 'string', 'max:255'],
            'contrasena_nueva' => ['required', 'string', 'min:'.PoliticaContrasena::LONGITUD_MINIMA, 'max:'.PoliticaContrasena::LONGITUD_MAXIMA, 'confirmed'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'contrasena_actual' => 'contraseña actual',
            'contrasena_nueva' => 'nueva contraseña',
            'contrasena_nueva_confirmation' => 'confirmación de la contraseña',
        ];
    }
}
