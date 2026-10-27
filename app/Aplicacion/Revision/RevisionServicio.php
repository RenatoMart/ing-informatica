<?php

namespace App\Aplicacion\Revision;

use App\Aplicacion\Compartido\NotificadorRevision;
use App\Dominio\Revision\DecisionRevision;
use App\Dominio\Revision\EntidadRevisable;
use App\Dominio\Revision\TipoDecision;
use App\Persistencia\Revision\RevisionRepositorio;

/**
 * Casos de uso de la revisión común: bandeja, decisión (con aviso al editor) e historial.
 */
class RevisionServicio
{
    public function __construct(
        private readonly RevisionRepositorio $repositorio,
        private readonly NotificadorRevision $notificador,
    ) {}

    /**
     * @return list<array{entidad: string, id_registro: int, titulo: string, operacion: string, editor: string}>
     */
    public function pendientes(): array
    {
        return array_map(static function (array $f): array {
            unset($f['id_editor']);

            return $f;
        }, $this->repositorio->pendientes());
    }

    /**
     * @return string Estado resultante de la entidad.
     */
    public function decidir(EntidadRevisable $entidad, int $id, int $idRevisor, TipoDecision $tipo, ?string $observaciones, ?bool $comoVigente = null): string
    {
        $contexto = $this->repositorio->contexto($entidad, $id);

        // Valida en Dominio (separación editor/revisor y observaciones) antes de tocar la BD.
        $decision = new DecisionRevision($tipo, $idRevisor, $contexto['id_editor'], $observaciones, $contexto['id_editor_cambio']);

        $estado = $this->repositorio->decidir($entidad, $id, $decision->tipo, $idRevisor, $decision->observaciones, $comoVigente);

        $this->notificador->decisionTomada(
            $entidad,
            $id,
            $contexto['titulo'],
            $contexto['id_editor_cambio'] ?? $contexto['id_editor'],
            $decision->tipo,
            $decision->observaciones,
        );

        return $estado;
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function historial(EntidadRevisable $entidad, int $id): array
    {
        return $this->repositorio->historial($entidad, $id);
    }
}
