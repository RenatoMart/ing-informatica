<?php

namespace App\Dominio\PlanEstudios;

/**
 * Estados de una versión del plan de estudios (sección 2.2).
 */
enum EstadoPlan: string
{
    case Borrador = 'borrador';
    case EnRevision = 'en_revision';
    case Vigente = 'vigente';
    case Historico = 'historico';
    case Descartado = 'descartado';

    /** Solo el borrador admite cambios en el plan y sus cursos. */
    public function esEditable(): bool
    {
        return $this === self::Borrador;
    }

    /** Estados visibles en el sitio público. */
    public function esPublico(): bool
    {
        return $this === self::Vigente || $this === self::Historico;
    }
}
