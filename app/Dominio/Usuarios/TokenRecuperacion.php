<?php

namespace App\Dominio\Usuarios;

use App\Dominio\Compartido\Excepciones\ReglaNegocioException;

/**
 * Token de recuperación: 64 caracteres hexadecimales aleatorios. En la BD solo se guarda su sha256.
 */
final readonly class TokenRecuperacion
{
    private function __construct(public string $valor) {}

    public static function generar(): self
    {
        return new self(bin2hex(random_bytes(32)));
    }

    /**
     * Token recibido del enlace. Un formato incorrecto se trata como enlace inválido.
     *
     * @throws ReglaNegocioException
     */
    public static function desde(string $valor): self
    {
        $valor = strtolower(trim($valor));

        if (! preg_match('/^[0-9a-f]{64}$/', $valor)) {
            throw new ReglaNegocioException('Enlace inválido o vencido.', 'token');
        }

        return new self($valor);
    }

    /** sha256 del token (lo único que se guarda). */
    public function hash(): string
    {
        return hash('sha256', $this->valor);
    }
}
