<?php

namespace App\Http\Requests\Panel\Publicaciones;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Datos de una publicación (alta y edición). Los roles se controlan con el middleware `rol:`.
 */
class GuardarPublicacionRequest extends FormRequest
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
            'titulo' => ['required', 'string', 'min:5', 'max:200'],
            'resumen' => ['nullable', 'string', 'max:500'],
            'contenido' => ['nullable', 'string', 'max:200000'],
            'categoria' => ['nullable', 'string', 'max:100'],
            'fecha_publicacion_programada' => ['nullable', 'date_format:Y-m-d'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'titulo.required' => 'El título es obligatorio.',
            'titulo.min' => 'El título debe tener al menos 5 caracteres.',
            'titulo.max' => 'El título no puede superar 200 caracteres.',
            'resumen.max' => 'El resumen no puede superar 500 caracteres.',
            'categoria.max' => 'La categoría no puede superar 100 caracteres.',
            'fecha_publicacion_programada.date_format' => 'La fecha programada debe tener el formato AAAA-MM-DD.',
        ];
    }
}
