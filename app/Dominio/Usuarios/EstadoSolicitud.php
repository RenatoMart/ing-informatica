<?php

namespace App\Dominio\Usuarios;

/**
 * `solicitud_acceso.estado` (ENUM `estado_solicitud`).
 */
enum EstadoSolicitud: string
{
    case Pendiente = 'pendiente';
    case Autorizada = 'autorizada';
    case Denegada = 'denegada';
}
