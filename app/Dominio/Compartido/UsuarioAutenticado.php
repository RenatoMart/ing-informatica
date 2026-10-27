<?php

namespace App\Dominio\Compartido;

/**
 * Contrato que cumple el usuario de la sesión del panel.
 *
 * Lo implementa `App\Persistencia\Usuarios\UsuarioAutenticable` (modelo del guard, paquete B4),
 * y lo consumen los middlewares `activo`, `cambio_contrasena` y `rol:` sin depender de Eloquent.
 * Los datos deben leerse de la BD en cada petición (el guard de sesión ya lo hace al resolver el usuario).
 */
interface UsuarioAutenticado
{
    /** `usuario.id_usuario`. */
    public function idUsuario(): int;

    /** `rol.nombre`: `Editor`, `Revisor` o `Administrador`. */
    public function nombreRol(): string;

    /** `usuario.estado = 'activo'`. */
    public function estaActivo(): bool;

    /** `usuario.debe_cambiar_contrasena`. */
    public function debeCambiarContrasena(): bool;
}
