<?php

namespace App\Http\Requests\Panel\Publicaciones;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Imagen de una publicación (multipart `imagen`): JPG, PNG o WebP de hasta 5 MB.
 * Las dimensiones mínimas (600×400) las valida `ProcesadorImagenes`.
 */
class SubirImagenPublicacionRequest extends FormRequest
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
            'imagen' => ['required', 'file', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'imagen.required' => 'Seleccione una imagen.',
            'imagen.file' => 'No se pudo recibir la imagen.',
            'imagen.mimes' => 'La imagen debe ser JPG, PNG o WebP.',
            'imagen.max' => 'La imagen no puede superar 5 MB.',
            'imagen.uploaded' => 'No se pudo recibir la imagen (revise su tamaño, máximo 5 MB).',
        ];
    }
}
