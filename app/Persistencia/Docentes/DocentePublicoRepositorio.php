<?php

namespace App\Persistencia\Docentes;

use App\Persistencia\Compartido\Repositorio;
use Illuminate\Support\Facades\DB;

/**
 * Lecturas públicas sobre `v_publico_docentes` (solo docentes publicados).
 */
class DocentePublicoRepositorio extends Repositorio
{
    /**
     * @param  array{id_departamento?: int|null, investigador?: bool, q?: string|null}  $filtros
     * @return list<array<string, mixed>> Filas con `especialidades` ya como lista.
     */
    public function listar(array $filtros): array
    {
        $consulta = $this->tabla('v_publico_docentes')
            ->select([
                'id_docente', 'nombres', 'apellidos', 'grado_academico', 'id_departamento', 'departamento',
                'curso_principal', 'condicion_laboral', 'es_investigador', 'categoria_renacyt',
                'ruta_fotografia', 'encuadre_x', 'encuadre_y', DB::raw('to_jsonb(especialidades) as especialidades'),
            ])
            ->orderBy('apellidos')->orderBy('nombres')->orderBy('id_docente');

        if (! empty($filtros['id_departamento'])) {
            $consulta->where('id_departamento', (int) $filtros['id_departamento']);
        }

        if (! empty($filtros['investigador'])) {
            $consulta->where('es_investigador', true);
        }

        if (! empty($filtros['q'])) {
            $consulta->whereRaw(
                "translate(lower(nombres || ' ' || apellidos || ' ' || coalesce(curso_principal, '') || ' ' || array_to_string(especialidades, ' ')), 'áéíóúüñ', 'aeiouun') like ?",
                ['%'.BusquedaTexto::patron((string) $filtros['q']).'%'],
            );
        }

        return array_map(function (array $fila): array {
            $fila['especialidades'] = json_decode((string) $fila['especialidades'], true) ?: [];

            return $fila;
        }, $this->todas($consulta));
    }
}
