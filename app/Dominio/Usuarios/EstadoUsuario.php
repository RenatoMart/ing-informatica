<?php

namespace App\Dominio\Usuarios;

/**
 * `usuario.estado` (ENUM `estado_usuario`). La baja desactiva; nunca se elimina un usuario.
 */
enum EstadoUsuario: string
{
    case Activo = 'activo';
    case Inactivo = 'inactivo';
}
