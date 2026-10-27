<?php

namespace App\Dominio\Usuarios;

/**
 * Bloqueo temporal de una cuenta por intentos fallidos, independiente de la IP (complementa el
 * throttle `login` de 5 por minuto por correo + IP). Se reinicia con un inicio de sesión correcto.
 */
final class PoliticaBloqueoAcceso
{
    /** Intentos fallidos permitidos dentro de la ventana. */
    public const MAXIMO_FALLOS = 10;

    /** Ventana y duración del bloqueo, en segundos (15 minutos). */
    public const SEGUNDOS_BLOQUEO = 900;

    /** Clave del contador por cuenta. */
    public static function clave(string $correo): string
    {
        return 'bloqueo-acceso|'.mb_strtolower(trim($correo));
    }
}
