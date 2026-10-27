<?php

namespace App\Dominio\Revision;

/**
 * Valor de `operacion_pendiente` sobre contenido ya publicado (solo publicación y docente).
 */
enum OperacionPendiente: string
{
    case Cambio = 'cambio';
    case Baja = 'baja';
}
