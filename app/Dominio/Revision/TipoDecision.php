<?php

namespace App\Dominio\Revision;

/**
 * Decisión del revisor sobre un registro en revisión o con operación pendiente.
 */
enum TipoDecision: string
{
    case Aprobar = 'aprobar';
    case Observar = 'observar';
    case Descartar = 'descartar';

    public function accion(): AccionRevision
    {
        return AccionRevision::from($this->value);
    }

    /** Observar y descartar exigen observaciones (de 5 a 500 caracteres). */
    public function exigeObservaciones(): bool
    {
        return $this !== self::Aprobar;
    }
}
