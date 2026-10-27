<?php

namespace App\Dominio\Revision\Politicas;

use App\Dominio\Revision\AccionRevision;
use App\Dominio\Revision\ActorRevision;
use App\Dominio\Revision\OperacionPendiente;
use App\Dominio\Revision\PoliticaRevision;
use App\Dominio\Revision\TipoDecision;
use App\Dominio\Revision\Transicion;

/**
 * Comportamiento común de las políticas: `admite()` se deriva de la tabla de transiciones.
 */
abstract class PoliticaBase implements PoliticaRevision
{
    public function admite(TipoDecision $decision): bool
    {
        foreach ($this->transiciones() as $transicion) {
            if ($transicion->accion === $decision->accion()) {
                return true;
            }
        }

        return false;
    }

    /**
     * Atajo para declarar una fila de la tabla.
     */
    protected static function t(
        ?string $desde,
        ?OperacionPendiente $operacion,
        AccionRevision $accion,
        string $hacia,
        ?OperacionPendiente $operacionResultante,
        ActorRevision $actor,
    ): Transicion {
        return new Transicion($desde, $operacion, $accion, $hacia, $operacionResultante, $actor);
    }
}
