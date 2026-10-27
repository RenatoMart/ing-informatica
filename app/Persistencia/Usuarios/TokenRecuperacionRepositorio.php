<?php

namespace App\Persistencia\Usuarios;

use App\Persistencia\Compartido\Repositorio;

/**
 * `token_recuperacion` (3.5): solo guarda el sha256 del token; todo vía `sp_token_recuperacion_*`.
 */
class TokenRecuperacionRepositorio extends Repositorio
{
    /**
     * Crea el token si hay un usuario activo con ese correo (invalida los anteriores).
     *
     * @return int|null `id_token`, o `null` si el correo no corresponde a un usuario activo.
     */
    public function crear(string $correo, string $hashToken, int $minutos, ?string $ip): ?int
    {
        $id = $this->sp->escalar('sp_token_recuperacion_crear', [$correo, $hashToken, $minutos, $ip]);

        return $id === null ? null : (int) $id;
    }

    /**
     * Consume el token (uso único), fija la nueva contraseña y borra las sesiones del usuario.
     *
     * @return int `id_usuario` afectado.
     */
    public function consumir(string $correo, string $hashToken, string $nuevoHash, ?string $ip): int
    {
        return (int) $this->sp->escalar('sp_token_recuperacion_consumir', [$correo, $hashToken, $nuevoHash, $ip]);
    }

    /** Borra los tokens con más de 7 días. Devuelve la cantidad borrada. */
    public function purgar(): int
    {
        return (int) $this->sp->escalar('sp_token_recuperacion_purgar');
    }
}
