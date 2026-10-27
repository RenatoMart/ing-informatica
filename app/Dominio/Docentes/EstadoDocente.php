<?php

namespace App\Dominio\Docentes;

/**
 * Estados de un docente (literales de `estado_docente`, sección 2.2).
 */
enum EstadoDocente: string
{
    case Borrador = 'borrador';
    case EnRevision = 'en_revision';
    case Publicado = 'publicado';
    case Inactivo = 'inactivo';

    /** Solo `publicado` aparece en la plana docente pública. */
    public function esPublico(): bool
    {
        return $this === self::Publicado;
    }
}
