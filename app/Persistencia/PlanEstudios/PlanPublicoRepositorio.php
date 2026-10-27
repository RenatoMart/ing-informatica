<?php

namespace App\Persistencia\PlanEstudios;

use App\Dominio\Compartido\Excepciones\NoEncontradoException;
use App\Persistencia\Compartido\Repositorio;

/**
 * Lecturas públicas: solo planes `vigente` e `historico` (funciones `sp_plan_publicos`/`sp_plan_predeterminado`
 * y vistas `v_publico_*`).
 */
class PlanPublicoRepositorio extends Repositorio
{
    /**
     * @return list<array<string, mixed>>
     */
    public function planes(): array
    {
        return array_map($this->normalizarPlan(...), $this->sp->filas('sp_plan_publicos'));
    }

    public function idPredeterminado(): ?int
    {
        $id = $this->sp->escalar('sp_plan_predeterminado');

        return $id === null ? null : (int) $id;
    }

    /**
     * @return array<string, mixed>
     *
     * @throws NoEncontradoException
     */
    public function plan(int $idPlan): array
    {
        return $this->normalizarPlan($this->primeraOFallar(
            $this->tabla('v_publico_planes')->where('id_plan', $idPlan)->select([
                'id_plan', 'anio', 'version', 'estado', 'es_predeterminada', 'archivo_pdf_plan', 'archivo_pdf_resolucion',
            ]),
            'Plan de estudios no encontrado.',
        ));
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function cursos(int $idPlan): array
    {
        return $this->todas(
            $this->tabla('v_publico_cursos')->where('id_plan', $idPlan)->orderBy('ciclo')->orderBy('codigo')->select([
                'codigo', 'nombre', 'creditos', 'tipo', 'ciclo', 'area_formacion', 'horas_teoria', 'horas_practica', 'descripcion',
            ]),
        );
    }

    /**
     * @return list<array{codigo_requerido: string, codigo_curso: string}>
     */
    public function prerrequisitos(int $idPlan): array
    {
        return array_map(
            static fn (array $f): array => ['codigo_requerido' => (string) $f['codigo_requerido'], 'codigo_curso' => (string) $f['codigo_curso']],
            $this->todas(
                $this->tabla('v_publico_prerrequisitos')->where('id_plan', $idPlan)->orderBy('codigo_curso')->orderBy('codigo_requerido')->select(['codigo_curso', 'codigo_requerido']),
            ),
        );
    }

    /**
     * @param  array<string, mixed>  $fila
     * @return array<string, mixed>
     */
    private function normalizarPlan(array $fila): array
    {
        return [
            'id_plan' => (int) $fila['id_plan'],
            'anio' => (int) $fila['anio'],
            'version' => (string) $fila['version'],
            'estado' => (string) $fila['estado'],
            'es_predeterminada' => (bool) $fila['es_predeterminada'],
            'archivo_pdf_plan' => $fila['archivo_pdf_plan'] ?? null,
            'archivo_pdf_resolucion' => $fila['archivo_pdf_resolucion'] ?? null,
        ];
    }
}
