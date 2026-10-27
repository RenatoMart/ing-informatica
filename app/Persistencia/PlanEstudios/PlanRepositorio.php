<?php

namespace App\Persistencia\PlanEstudios;

use App\Dominio\Compartido\Excepciones\NoEncontradoException;
use App\Dominio\Revision\DecisionRevision;
use App\Persistencia\Compartido\Repositorio;
use Illuminate\Support\Facades\DB;

/**
 * Versiones del plan: escribe solo con `sp_plan_*` y lee con Query Builder.
 */
class PlanRepositorio extends Repositorio
{
    use EscribeEnSavepoint;

    public function crear(int $idEditor, int $anio, string $version): int
    {
        return (int) $this->escribir(fn () => $this->sp->escalar('sp_plan_crear', [$idEditor, $anio, $version]));
    }

    public function actualizar(int $idEditor, int $idPlan, int $anio, string $version): void
    {
        $this->escribir(fn () => $this->sp->ejecutar('sp_plan_actualizar', [$idEditor, $idPlan, $anio, $version]));
    }

    public function duplicar(int $idEditor, int $idOrigen, string $version): int
    {
        return (int) $this->escribir(fn () => $this->sp->escalar('sp_plan_duplicar', [$idEditor, $idOrigen, $version]));
    }

    /**
     * @param  string  $tipo  `plan` o `resolucion`.
     * @return string|null Ruta del PDF reemplazado.
     */
    public function adjuntarPdf(int $idEditor, int $idPlan, string $tipo, string $ruta): ?string
    {
        $anterior = $this->escribir(fn () => $this->sp->escalar('sp_plan_adjuntar_pdf', [$idEditor, $idPlan, $tipo, $ruta]));

        return $anterior === null ? null : (string) $anterior;
    }

    /**
     * @return list<array{nivel: string, codigo: string, mensaje: string}>
     */
    public function validar(int $idPlan): array
    {
        /** @var list<array{nivel: string, codigo: string, mensaje: string}> */
        return $this->sp->filas('sp_plan_validar', [$idPlan]);
    }

    public function enviarRevision(int $idEditor, int $idPlan): void
    {
        $this->escribir(fn () => $this->sp->ejecutar('sp_plan_enviar_revision', [$idEditor, $idPlan]));
    }

    /**
     * Aplica la decisión del Director (`sp_plan_decidir`) y devuelve el estado nuevo.
     */
    public function decidir(DecisionRevision $decision, int $idPlan, bool $comoVigente): string
    {
        return (string) $this->escribir(fn () => $this->sp->escalar('sp_plan_decidir', [
            $decision->idRevisor,
            $idPlan,
            $decision->tipo->value,
            $decision->observaciones,
            $comoVigente,
        ]));
    }

    public function establecerPredeterminado(int $idRevisor, int $idPlan): void
    {
        $this->escribir(fn () => $this->sp->ejecutar('sp_plan_establecer_predeterminado', [$idRevisor, $idPlan]));
    }

    /**
     * Listado del panel con totales de cursos y créditos.
     *
     * @return list<array<string, mixed>>
     */
    public function listar(): array
    {
        $totales = DB::table('curso')
            ->select('id_plan', DB::raw('count(*) as total_cursos'), DB::raw('sum(creditos) as total_creditos'))
            ->groupBy('id_plan');

        $filas = $this->tabla('plan_estudios as p')
            ->leftJoinSub($totales, 't', 't.id_plan', '=', 'p.id_plan')
            ->orderByDesc('p.anio')
            ->orderByDesc('p.version')
            ->get([
                'p.id_plan', 'p.anio', 'p.version', 'p.estado', 'p.es_predeterminada',
                DB::raw('coalesce(t.total_cursos, 0) as total_cursos'),
                DB::raw('coalesce(t.total_creditos, 0) as total_creditos'),
            ]);

        return $filas->map(static fn (object $f): array => [
            'id_plan' => (int) $f->id_plan,
            'anio' => (int) $f->anio,
            'version' => $f->version,
            'estado' => (string) $f->estado,
            'es_predeterminada' => (bool) $f->es_predeterminada,
            'total_cursos' => (int) $f->total_cursos,
            'total_creditos' => (int) $f->total_creditos,
        ])->all();
    }

    /**
     * @return array<string, mixed>
     *
     * @throws NoEncontradoException
     */
    public function obtener(int $idPlan): array
    {
        $fila = $this->primeraOFallar(
            $this->tabla('plan_estudios')->where('id_plan', $idPlan)->select([
                'id_plan', 'anio', 'version', 'estado', 'es_predeterminada', 'archivo_pdf_plan', 'archivo_pdf_resolucion',
                'fecha_publicacion', 'id_editor', 'id_director_revisa', 'fecha_decision', 'observaciones_revision',
            ]),
            'Plan de estudios no encontrado.',
        );

        $fila['id_plan'] = (int) $fila['id_plan'];
        $fila['anio'] = (int) $fila['anio'];
        $fila['es_predeterminada'] = (bool) $fila['es_predeterminada'];

        return $fila;
    }
}
