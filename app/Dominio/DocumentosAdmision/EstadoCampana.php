<?php

namespace App\Dominio\DocumentosAdmision;

/**
 * Estado de la campaña de admisión (enum `estado_campana`; transiciones en la sección 2.2).
 */
enum EstadoCampana: string
{
    case Borrador = 'borrador';
    case EnRevision = 'en_revision';
    case Vigente = 'vigente';
    case Cerrada = 'cerrada';
    case Archivada = 'archivada';

    /** Solo se edita (cabecera, modalidades, hitos) en borrador. */
    public function esEditable(): bool
    {
        return $this === self::Borrador;
    }

    /**
     * Estado que toma esta campaña cuando otra pasa a vigente: la única vigente reemplaza
     * a la vigente y a la cerrada, que quedan archivadas.
     */
    public function alAprobarOtraVigente(): self
    {
        return match ($this) {
            self::Vigente, self::Cerrada => self::Archivada,
            default => $this,
        };
    }
}
