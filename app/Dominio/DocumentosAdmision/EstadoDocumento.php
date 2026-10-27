<?php

namespace App\Dominio\DocumentosAdmision;

/**
 * Estado del documento oficial (enum `estado_documento`; transiciones en la sección 2.2).
 */
enum EstadoDocumento: string
{
    case EnRevision = 'en_revision';
    case Vigente = 'vigente';
    case Historico = 'historico';
    case Vencido = 'vencido';
    case NoPublicado = 'no_publicado';

    /** Solo un documento no publicado (observado o descartado) puede editarse. */
    public function esEditable(): bool
    {
        return $this === self::NoPublicado;
    }

    /** Solo un documento vigente o vencido puede ser reemplazado por una versión nueva. */
    public function admiteVersionPosterior(): bool
    {
        return $this === self::Vigente || $this === self::Vencido;
    }

    /** Estados visibles en el sitio público. */
    public function esPublico(): bool
    {
        return $this === self::Vigente || $this === self::Historico;
    }
}
