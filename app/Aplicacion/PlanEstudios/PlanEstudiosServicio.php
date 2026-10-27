<?php

namespace App\Aplicacion\PlanEstudios;

use App\Aplicacion\Compartido\AlmacenArchivos;
use App\Aplicacion\Compartido\NotificadorRevision;
use App\Dominio\Compartido\Excepciones\ExcepcionDominio;
use App\Dominio\PlanEstudios\PlanEstudios;
use App\Dominio\Revision\DecisionRevision;
use App\Dominio\Revision\EntidadRevisable;
use App\Dominio\Revision\TipoDecision;
use App\Persistencia\PlanEstudios\CursoRepositorio;
use App\Persistencia\PlanEstudios\PlanRepositorio;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

/**
 * Versiones del plan: crear, actualizar, duplicar, PDF, validación, revisión y predeterminado (HU4, P6).
 */
class PlanEstudiosServicio
{
    public function __construct(
        private readonly PlanRepositorio $planes,
        private readonly CursoRepositorio $cursos,
        private readonly AlmacenArchivos $archivos,
        private readonly NotificadorRevision $notificador,
    ) {}

    /** @return list<array<string, mixed>> */
    public function listar(): array
    {
        return $this->planes->listar();
    }

    /** @return array{id_plan: int} */
    public function crear(int $idEditor, int $anio, string $version): array
    {
        $plan = new PlanEstudios($anio, $version);

        return ['id_plan' => $this->planes->crear($idEditor, $plan->anio, $plan->version)];
    }

    public function actualizar(int $idEditor, int $idPlan, int $anio, string $version): void
    {
        $plan = new PlanEstudios($anio, $version);
        $this->planes->actualizar($idEditor, $idPlan, $plan->anio, $plan->version);
    }

    /** @return array{id_plan: int} */
    public function duplicar(int $idEditor, int $idOrigen, string $version): array
    {
        return ['id_plan' => $this->planes->duplicar($idEditor, $idOrigen, trim($version))];
    }

    /**
     * Plan con sus cursos, prerrequisitos y URLs de PDF.
     *
     * @return array<string, mixed>
     */
    public function detalle(int $idPlan): array
    {
        $plan = $this->planes->obtener($idPlan);

        return [
            'id_plan' => $plan['id_plan'],
            'anio' => $plan['anio'],
            'version' => $plan['version'],
            'estado' => (string) $plan['estado'],
            'es_predeterminada' => $plan['es_predeterminada'],
            'fecha_publicacion' => $plan['fecha_publicacion'],
            'observaciones_revision' => $plan['observaciones_revision'],
            'pdf_plan_url' => $this->archivos->url($plan['archivo_pdf_plan']),
            'pdf_resolucion_url' => $this->archivos->url($plan['archivo_pdf_resolucion']),
            'cursos' => $this->cursos->dePlan($idPlan),
            'prerrequisitos' => $this->cursos->prerrequisitosDePlan($idPlan),
        ];
    }

    /**
     * Reporte de `sp_plan_validar`.
     *
     * @return list<array{nivel: string, codigo: string, mensaje: string}>
     */
    public function validar(int $idPlan): array
    {
        $this->planes->obtener($idPlan);

        return $this->planes->validar($idPlan);
    }

    /**
     * Guarda el PDF (`plan` o `resolucion`) y borra el anterior después del commit.
     *
     * @return array{url: string|null}
     *
     * @throws ExcepcionDominio
     */
    public function subirPdf(int $idEditor, int $idPlan, string $tipo, UploadedFile $archivo): array
    {
        $this->planes->obtener($idPlan);
        $ruta = $this->archivos->guardarArchivo($archivo, "planes/{$idPlan}", 'pdf', $tipo === 'plan' ? 'plan' : 'resolucion');

        try {
            $anterior = DB::transaction(function () use ($idEditor, $idPlan, $tipo, $ruta): ?string {
                $anterior = $this->planes->adjuntarPdf($idEditor, $idPlan, $tipo, $ruta);
                $this->archivos->eliminarSiHuerfano($anterior);

                return $anterior;
            });
        } catch (ExcepcionDominio $error) {
            $this->archivos->descartar($ruta);

            throw $error;
        }

        return ['url' => $this->archivos->url($ruta)];
    }

    public function enviarRevision(int $idEditor, int $idPlan): void
    {
        $this->planes->enviarRevision($idEditor, $idPlan);
        $plan = $this->planes->obtener($idPlan);

        $this->notificador->enviadoARevision(
            EntidadRevisable::Plan,
            $idPlan,
            "Plan de estudios {$plan['anio']} v{$plan['version']}",
            'revision',
            $idEditor,
        );
    }

    /**
     * Decisión del Director. Devuelve el estado nuevo. Lo usa el endpoint común de revisión.
     *
     * @throws ExcepcionDominio
     */
    public function decidir(int $idRevisor, int $idPlan, TipoDecision $tipo, ?string $observaciones = null, bool $comoVigente = true): string
    {
        $plan = $this->planes->obtener($idPlan);
        $decision = new DecisionRevision($tipo, $idRevisor, (int) $plan['id_editor'], $observaciones);

        $estado = $this->planes->decidir($decision, $idPlan, $comoVigente);

        $this->notificador->decisionTomada(
            EntidadRevisable::Plan,
            $idPlan,
            "Plan de estudios {$plan['anio']} v{$plan['version']}",
            (int) $plan['id_editor'],
            $tipo,
            $decision->observaciones,
        );

        return $estado;
    }

    public function establecerPredeterminado(int $idRevisor, int $idPlan): void
    {
        $this->planes->establecerPredeterminado($idRevisor, $idPlan);
    }
}
