<?php

namespace App\Http\Requests\Panel\Docentes;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Foto del docente (multipart `foto`) con su encuadre. Las dimensiones mínimas (300×300) las valida el Dominio.
 */
class SubirFotoDocenteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, list<string>>
     */
    public function rules(): array
    {
        return [
            'foto' => ['required', 'file', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'encuadre_x' => ['nullable', 'integer', 'between:0,100'],
            'encuadre_y' => ['nullable', 'integer', 'between:0,100'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'foto.required' => 'Seleccione una foto.',
            'foto.file' => 'No se pudo recibir la foto.',
            'foto.mimes' => 'La foto debe ser JPG, PNG o WebP.',
            'foto.max' => 'La foto no puede superar 5 MB.',
            'foto.uploaded' => 'No se pudo recibir la foto (revise su tamaño, máximo 5 MB).',
            'encuadre_x.between' => 'El encuadre horizontal debe estar entre 0 y 100.',
            'encuadre_y.between' => 'El encuadre vertical debe estar entre 0 y 100.',
            'encuadre_x.integer' => 'El encuadre horizontal debe ser un número entero.',
            'encuadre_y.integer' => 'El encuadre vertical debe ser un número entero.',
        ];
    }
}
