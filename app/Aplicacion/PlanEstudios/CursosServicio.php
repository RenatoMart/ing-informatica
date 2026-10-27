<?php

namespace App\Aplicacion\PlanEstudios;

use App\Dominio\Compartido\Excepciones\ReglaNegocioException;
use App\Dominio\PlanEstudios\Curso;
use App\Dominio\PlanEstudios\GrafoPrerrequisitos;
use App\Dominio\PlanEstudios\Prerrequisitos;
use App\Persistencia\PlanEstudios\CursoRepositorio;
use App\Persistencia\PlanEstudios\PlanRepositorio;

/**
 * CRUD de cursos, importación masiva y prerrequisitos de un plan en borrador.
 */
class CursosServicio
{
    public const MAXIMO_IMPORTACION = 120;

    public function __construct(
        private readonly CursoRepositorio $cursos,
        private readonly PlanRepositorio $planes,
    ) {}

    /**
     * @param  array<string, mixed>  $datos
     * @return array{id_curso: int}
     */
    public function crear(int $idEditor, int $idPlan, array $datos): array
    {
        $this->planes->obtener($idPlan);

        return ['id_curso' => $this->cursos->guardar($idEditor, $idPlan, Curso::desdeArreglo($datos))];
    }

    /**
     * @param  array<string, mixed>  $datos
     */
    public function actualizar(int $idEditor, int $idCurso, array $datos): void
    {
        $idPlan = $this->cursos->idPlanDeCurso($idCurso);

        $this->cursos->guardar($idEditor, $idPlan, Curso::desdeArreglo($datos, $idCurso));
    }

    public function eliminar(int $idEditor, int $idCurso): void
    {
        $this->cursos->eliminar($idEditor, $idCurso);
    }

    /**
     * Upsert por código. Cada fila se valida en el Dominio con la ruta `cursos[i].campo`.
     *
     * @param  list<array<string, mixed>>  $filas
     * @return array{importados: int}
     *
     * @throws ReglaNegocioException
     */
    public function importar(int $idEditor, int $idPlan, array $filas): array
    {
        $this->planes->obtener($idPlan);

        if ($filas === [] || count($filas) > self::MAXIMO_IMPORTACION) {
            throw new ReglaNegocioException('Indique entre 1 y '.self::MAXIMO_IMPORTACION.' cursos.', 'cursos');
        }

        $limpias = [];
        foreach (array_values($filas) as $i => $fila) {
            try {
                $limpias[] = Curso::desdeArreglo($fila)->aArreglo();
            } catch (ReglaNegocioException $error) {
                throw new ReglaNegocioException($error->getMessage(), "cursos[{$i}].".$error->campo());
            }
        }

        $limpias = array_map(static function (array $c): array {
            unset($c['id_curso']);

            return $c;
        }, $limpias);

        return ['importados' => $this->cursos->importar($idEditor, $idPlan, $limpias)];
    }

    /**
     * Reemplaza los requeridos del curso. Detecta el ciclo en memoria (422 con la ruta) antes de ir a la BD,
     * que lo vuelve a comprobar y revierte.
     *
     * @param  list<int>  $idsRequeridos
     *
     * @throws ReglaNegocioException
     */
    public function establecerPrerrequisitos(int $idEditor, int $idCurso, array $idsRequeridos): void
    {
        $idPlan = $this->cursos->idPlanDeCurso($idCurso);
        $nuevos = new Prerrequisitos($idCurso, $idsRequeridos);

        $grafo = $this->grafoDelPlan($idPlan, $nuevos);
        $ruta = $grafo->detectarCiclo();

        if ($ruta !== null) {
            throw new ReglaNegocioException('Prerrequisito circular: '.implode(' → ', $ruta), 'prerrequisitos');
        }

        $this->cursos->establecerPrerrequisitos($idEditor, $idCurso, $nuevos->idsRequeridos);
    }

    private function grafoDelPlan(int $idPlan, Prerrequisitos $nuevos): GrafoPrerrequisitos
    {
        $codigos = [];
        $ciclos = [];
        foreach ($this->cursos->dePlan($idPlan) as $curso) {
            $codigos[$curso['id_curso']] = $curso['codigo'];
            $ciclos[$curso['codigo']] = $curso['ciclo'];
        }

        $requisitos = [];
        foreach ($this->cursos->prerrequisitosDePlan($idPlan) as $arista) {
            if ($arista['id_curso'] === $nuevos->idCurso) {
                continue;
            }
            $requisitos[$codigos[$arista['id_curso']]][] = $codigos[$arista['id_curso_requerido']];
        }

        $grafo = new GrafoPrerrequisitos($requisitos, $ciclos);

        return $grafo->conRequisitos(
            $codigos[$nuevos->idCurso],
            array_values(array_filter(array_map(static fn (int $id): ?string => $codigos[$id] ?? null, $nuevos->idsRequeridos))),
        );
    }
}
