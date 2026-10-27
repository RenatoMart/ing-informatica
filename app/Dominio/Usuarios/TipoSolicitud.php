<?php

namespace App\Dominio\Usuarios;

/**
 * `solicitud_acceso.tipo_solicitud` (ENUM `tipo_solicitud`).
 */
enum TipoSolicitud: string
{
    case Alta = 'alta';
    case CambioRol = 'cambio_rol';
    case Baja = 'baja';

    public function etiqueta(): string
    {
        return match ($this) {
            self::Alta => 'alta',
            self::CambioRol => 'cambio de rol',
            self::Baja => 'baja',
        };
    }
}
