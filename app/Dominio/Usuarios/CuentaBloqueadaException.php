<?php

namespace App\Dominio\Usuarios;

use App\Dominio\Compartido\Excepciones\ExcepcionDominio;

/**
 * Demasiados intentos fallidos de inicio de sesión sobre una cuenta (429 `DEMASIADOS_INTENTOS`).
 * Solo la lanza PHP (bloqueo temporal por intentos, {@see PoliticaBloqueoAcceso}).
 */
class CuentaBloqueadaException extends ExcepcionDominio
{
    public function __construct(int $segundosRestantes)
    {
        $minutos = max(1, (int) ceil($segundosRestantes / 60));

        parent::__construct("Demasiados intentos fallidos. Intente nuevamente en {$minutos} minuto(s).");
    }

    public function estadoHttp(): int
    {
        return 429;
    }

    public function sqlstate(): string
    {
        return 'RN429';
    }

    protected function codigoPorDefecto(): string
    {
        return 'DEMASIADOS_INTENTOS';
    }
}
