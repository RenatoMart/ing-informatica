<?php

namespace App\Aplicacion\Docentes;

use App\Aplicacion\Compartido\AlmacenArchivos;
use App\Persistencia\Docentes\DepartamentoRepositorio;
use App\Persistencia\Docentes\DocentePublicoRepositorio;

/**
 * Plana docente y departamentos del sitio público (solo docentes publicados).
 */
class ConsultaDocentesServicio
{
    public function __construct(
        private readonly DocentePublicoRepositorio $docentes,
        private readonly DepartamentoRepositorio $departamentos,
        private readonly AlmacenArchivos $almacen,
    ) {}

    /**
     * @param  array{id_departamento?: int|string|null, investigador?: bool, q?: string|null}  $filtros
     * @return list<array<string, mixed>>
     */
    public function listar(array $filtros): array
    {
        return array_map(fn (array $d): array => [
            'id_docente' => (int) $d['id_docente'],
            'nombres' => $d['nombres'],
            'apellidos' => $d['apellidos'],
            'grado_academico' => $d['grado_academico'],
            'departamento' => $d['departamento'],
            'curso_principal' => $d['curso_principal'],
            'especialidades' => $d['especialidades'],
            'condicion_laboral' => $d['condicion_laboral'],
            'es_investigador' => (bool) $d['es_investigador'],
            'categoria_renacyt' => $d['categoria_renacyt'],
            'foto_url' => $this->almacen->url($d['ruta_fotografia']),
            'encuadre_x' => $d['encuadre_x'] === null ? null : (int) $d['encuadre_x'],
            'encuadre_y' => $d['encuadre_y'] === null ? null : (int) $d['encuadre_y'],
        ], $this->docentes->listar($filtros));
    }

    /**
     * @return list<array{id_departamento: int, nombre: string}>
     */
    public function departamentos(bool $soloConDocentes): array
    {
        return $this->departamentos->listarPublicos($soloConDocentes);
    }
}
