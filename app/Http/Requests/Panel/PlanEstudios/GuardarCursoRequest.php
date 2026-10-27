<?php

namespace App\Http\Requests\Panel\PlanEstudios;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Crear o actualizar un curso.
 */
class GuardarCursoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, list<string>> */
    public function rules(): array
    {
        return [
            'codigo' => ['required', 'string', 'max:20', 'regex:/^\S+$/'],
            'nombre' => ['required', 'string', 'max:150'],
            'creditos' => ['required', 'integer', 'between:1,10'],
            'tipo' => ['required', 'in:obligatorio,electivo'],
            'ciclo' => ['required', 'integer', 'between:1,10'],
            'area_formacion' => ['required', 'in:general,especifico,especialidad'],
            'horas_teoria' => ['required', 'integer', 'between:0,10'],
            'horas_practica' => ['required', 'integer', 'between:0,10'],
            'descripcion' => ['nullable', 'string', 'max:500'],
        ];
    }
}
