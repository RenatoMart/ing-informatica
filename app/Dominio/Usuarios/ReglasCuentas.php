<?php

namespace App\Dominio\Usuarios;

use App\Dominio\Compartido\Excepciones\TransicionInvalidaException;

/**
 * Reglas del ciclo de vida de cuentas (3.4): no hay auto-baja y siempre queda al menos
 * un Administrador activo. PL/pgSQL las vuelve a comprobar (defensa en profundidad).
 */
final class ReglasCuentas
{
    /**
     * @throws TransicionInvalidaException
     */
    public static function verificarBaja(int $idActor, Usuario $objetivo, int $administradoresActivos): void
    {
        if ($objetivo->idUsuario === $idActor) {
            throw new TransicionInvalidaException('No puede darse de baja a sí mismo.', 'id_usuario_objetivo');
        }

        if (! $objetivo->estaActivo()) {
            throw new TransicionInvalidaException('El usuario ya está inactivo.', 'id_usuario_objetivo');
        }

        if ($objetivo->esAdministrador() && $administradoresActivos <= 1) {
            throw new TransicionInvalidaException('No se puede dar de baja al último Administrador activo.', 'id_usuario_objetivo');
        }
    }

    /**
     * @throws TransicionInvalidaException
     */
    public static function verificarCambioRol(Usuario $objetivo, Rol $nuevoRol, int $administradoresActivos): void
    {
        if (! $objetivo->estaActivo()) {
            throw new TransicionInvalidaException('El usuario está inactivo.', 'id_usuario_objetivo');
        }

        if ($objetivo->rol === $nuevoRol) {
            throw new TransicionInvalidaException('El usuario ya tiene ese rol.', 'id_rol_solicitado');
        }

        if ($objetivo->esAdministrador() && $administradoresActivos <= 1) {
            throw new TransicionInvalidaException('No se puede quitar el rol al último Administrador activo.', 'id_usuario_objetivo');
        }
    }
}
