<?php

namespace App\Persistencia\PlanEstudios;

use App\Dominio\Compartido\Excepciones\NoEncontradoException;
use App\Dominio\PlanEstudios\Curso;
use App\Persistencia\Compartido\ArgumentoSql;
use App\Persistencia\Compartido\Repositorio;

/**
 * Cursos y prerrequisitos: escribe solo con `sp_curso_*` y lee con Query Builder.
 */
class CursoRepositorio extends Repositorio
{
    use EscribeEnSavepoint;

    public function guardar(int $idEditor, int $idPlan, Curso $curso): int
    {
        return (int) $this->escribir(fn () => $this->sp->escalar('sp_curso_guardar', [
            $idEditor, $idPlan, $curso->idCurso, $curso->codigo, $curso->nombre, $curso->creditos,
            $curso->tipo->value, $curso->ciclo, $curso->area->value, $curso->horasTeoria, $curso->horasPractica,
            $curso->descripcion,
        ]));
    }

    public function eliminar(int $idEditor, int $idCurso): void
    {
        $this->escribir(fn () => $this->sp->ejecutar('sp_curso_eliminar', [$idEditor, $idCurso]));
    }

    /**
     * @param  list<array<string, mixed>>  $cursos
     * @return int Cantidad importada.
     */
    public function importar(int $idEditor, int $idPlan, array $cursos): int
    {
        return (int) $this->escribir(fn () => $this->sp->escalar('sp_curso_importar', [
            $idEditor, $idPlan, ArgumentoSql::json($cursos),
        ]));
    }

    /**
     * @param  list<int>  $idsRequeridos
     */
    public function establecerPrerrequisitos(int $idEditor, int $idCurso, array $idsRequeridos): void
    {
        $this->escribir(fn () => $this->sp->ejecutar('sp_curso_establecer_prerrequisitos', [
            $idEditor, $idCurso, ArgumentoSql::arregloEntero($idsRequeridos),
        ]));
    }

    public function detectarCiclo(int $idPlan): ?string
    {
        $ruta = $this->sp->escalar('sp_plan_detectar_ciclo', [$idPlan]);

        return $ruta === null ? null : (string) $ruta;
    }

    /**
     * @throws NoEncontradoException
     */
    public function idPlanDeCurso(int $idCurso): int
    {
        $fila = $this->tabla('curso')->where('id_curso', $idCurso)->first(['id_plan']);

        if ($fila === null) {
            throw new NoEncontradoException('Curso no encontrado.');
        }

        return (int) $fila->id_plan;
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function dePlan(int $idPlan): array
    {
        $filas = $this->todas(
            $this->tabla('curso')->where('id_plan', $idPlan)->orderBy('ciclo')->orderBy('codigo')->select([
                'id_curso', 'codigo', 'nombre', 'creditos', 'tipo', 'ciclo', 'area_formacion', 'horas_teoria', 'horas_practica', 'descripcion',
            ]),
        );

        return array_map(static fn (array $f): array => [
            'id_curso' => (int) $f['id_curso'],
            'codigo' => $f['codigo'],
            'nombre' => $f['nombre'],
            'creditos' => (int) $f['creditos'],
            'tipo' => (string) $f['tipo'],
            'ciclo' => (int) $f['ciclo'],
            'area_formacion' => $f['area_formacion'],
            'horas_teoria' => (int) $f['horas_teoria'],
            'horas_practica' => (int) $f['horas_practica'],
            'descripcion' => $f['descripcion'],
        ], $filas);
    }

    /**
     * @return list<array{id_curso: int, id_curso_requerido: int}>
     */
    public function prerrequisitosDePlan(int $idPlan): array
    {
        $filas = $this->todas(
            $this->tabla('prerrequisito as r')
                ->join('curso as c', 'c.id_curso', '=', 'r.id_curso')
                ->where('c.id_plan', $idPlan)
                ->orderBy('r.id_curso')->orderBy('r.id_curso_requerido')
                ->select('r.id_curso', 'r.id_curso_requerido'),
        );

        return array_map(static fn (array $f): array => [
            'id_curso' => (int) $f['id_curso'],
            'id_curso_requerido' => (int) $f['id_curso_requerido'],
        ], $filas);
    }
}
