<?php

namespace App\Http\Requests\Panel\Usuarios;

use App\Dominio\Usuarios\TipoSolicitud;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * `POST /solicitudes`: `{solicitante_nombre, tipo_solicitud, id_rol_solicitado, motivo, correo_solicitado?, id_usuario_objetivo?}`.
 * Alta: correo y rol obligatorios. Cambio de rol: usuario objetivo y rol. Baja: usuario objetivo.
 */
class RegistrarSolicitudRequest extends FormRequest
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
            'solicitante_nombre' => ['required', 'string', 'max:150'],
            'tipo_solicitud' => ['required', Rule::enum(TipoSolicitud::class)],
            'id_rol_solicitado' => ['nullable', 'required_unless:tipo_solicitud,baja', 'integer', 'min:1'],
            'motivo' => ['nullable', 'string', 'max:255'],
            'correo_solicitado' => ['nullable', 'required_if:tipo_solicitud,alta', 'string', 'email', 'max:150'],
            'id_usuario_objetivo' => ['nullable', 'required_unless:tipo_solicitud,alta', 'integer', 'min:1'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'solicitante_nombre' => 'nombre del solicitante',
            'tipo_solicitud' => 'tipo de solicitud',
            'id_rol_solicitado' => 'rol solicitado',
            'correo_solicitado' => 'correo solicitado',
            'id_usuario_objetivo' => 'usuario objetivo',
        ];
    }

    /**
     * @return array{solicitante_nombre: string, tipo_solicitud: string, id_rol_solicitado: int|null, motivo: string|null, correo_solicitado: string|null, id_usuario_objetivo: int|null}
     */
    public function datos(): array
    {
        return [
            'solicitante_nombre' => (string) $this->validated('solicitante_nombre'),
            'tipo_solicitud' => (string) $this->validated('tipo_solicitud'),
            'id_rol_solicitado' => $this->filled('id_rol_solicitado') ? (int) $this->validated('id_rol_solicitado') : null,
            'motivo' => $this->validated('motivo'),
            'correo_solicitado' => $this->validated('correo_solicitado'),
            'id_usuario_objetivo' => $this->filled('id_usuario_objetivo') ? (int) $this->validated('id_usuario_objetivo') : null,
        ];
    }
}
