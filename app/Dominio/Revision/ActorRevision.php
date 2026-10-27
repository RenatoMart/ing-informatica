<?php

namespace App\Dominio\Revision;

/**
 * Quién ejecuta una transición (columna "Actor" de la sección 2.2).
 */
enum ActorRevision: string
{
    /** Editor, o Revisor actuando como editor. */
    case Editor = 'E';

    /** Revisor (Director), nunca sobre contenido que él mismo editó. */
    case Revisor = 'R';

    /** Tarea programada o efecto automático de otra transición. */
    case Sistema = 'S';
}
