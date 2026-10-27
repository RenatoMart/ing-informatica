<?php

namespace App\Dominio\Publicaciones;

/**
 * Estados de una publicación (literales del tipo `estado_publicacion`, sección 2.2).
 */
enum EstadoPublicacion: string
{
    case Borrador = 'borrador';
    case EnRevision = 'en_revision';
    case Publicada = 'publicada';
    case Descartada = 'descartada';
    case Despublicada = 'despublicada';

    /** Solo `publicada` es visible en el sitio público. */
    public function esPublico(): bool
    {
        return $this === self::Publicada;
    }

    /** En borrador los cambios se aplican directo; en publicada se guardan como cambio pendiente. */
    public function editaDirecto(): bool
    {
        return $this === self::Borrador;
    }
}
