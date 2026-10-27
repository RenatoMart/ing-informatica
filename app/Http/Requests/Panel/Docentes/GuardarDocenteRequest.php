<?php

namespace App\Http\Requests\Panel\Docentes;

use App\Dominio\Docentes\CondicionLaboral;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Datos de un docente (alta y edición). RENACYT solo con `es_investigador` (lo reafirma el Dominio).
 */
class GuardarDocenteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, list<mixed>>
     */
    public function rules(): array
    {
        return [
            'nombres' => ['required', 'string', 'max:100'],
            'apellidos' => ['required', 'string', 'max:100'],
            'grado_academico' => ['nullable', 'string', 'max:100'],
            'id_departamento' => ['required', 'integer'],
            'curso_principal' => ['nullable', 'string', 'max:150'],
            'condicion_laboral' => ['nullable', Rule::enum(CondicionLaboral::class)],
            'es_investigador' => ['required', 'boolean'],
            'categoria_renacyt' => ['nullable', 'string', 'max:50'],
            'especialidades' => ['required', 'array', 'min:1', 'max:5'],
            'especialidades.*' => ['required', 'string', 'max:150'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'nombres.required' => 'Los nombres son obligatorios.',
            'apellidos.required' => 'Los apellidos son obligatorios.',
            'id_departamento.required' => 'Seleccione un departamento.',
            'condicion_laboral.enum' => 'La condición laboral debe ser nombrado o contratado.',
            'es_investigador.required' => 'Indique si el docente es investigador.',
            'es_investigador.boolean' => 'El campo investigador debe ser verdadero o falso.',
            'categoria_renacyt.max' => 'La categoría RENACYT no puede superar 50 caracteres.',
            'especialidades.required' => 'Indique entre 1 y 5 especialidades.',
            'especialidades.min' => 'Indique al menos una especialidad.',
            'especialidades.max' => 'Indique como máximo 5 especialidades.',
            'especialidades.*.max' => 'Cada especialidad admite como máximo 150 caracteres.',
            'especialidades.*.required' => 'Las especialidades no pueden estar vacías.',
        ];
    }
}
