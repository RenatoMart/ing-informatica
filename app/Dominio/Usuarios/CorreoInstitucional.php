<?php

namespace App\Dominio\Usuarios;

use App\Dominio\Compartido\Excepciones\ReglaNegocioException;
use Stringable;

/**
 * Correo institucional: formato válido, 150 caracteres como máximo y del dominio configurado
 * (`portal.dominio_correo`, que la capa de Aplicación inyecta). Se normaliza a minúsculas.
 */
final readonly class CorreoInstitucional implements Stringable
{
    public const LONGITUD_MAXIMA = 150;

    private function __construct(public string $valor) {}

    /**
     * @param  string|null  $dominio  Dominio obligatorio (sin `@`); `null` o vacío no restringe el dominio.
     *
     * @throws ReglaNegocioException
     */
    public static function desde(string $valor, ?string $dominio, string $campo = 'correo_institucional'): self
    {
        $valor = mb_strtolower(trim($valor));

        if ($valor === '') {
            throw new ReglaNegocioException('El correo institucional es obligatorio.', $campo);
        }

        if (mb_strlen($valor) > self::LONGITUD_MAXIMA) {
            throw new ReglaNegocioException('El correo no puede superar 150 caracteres.', $campo);
        }

        if (filter_var($valor, FILTER_VALIDATE_EMAIL) === false) {
            throw new ReglaNegocioException('El correo no tiene un formato válido.', $campo);
        }

        $dominio = mb_strtolower(trim((string) $dominio, " \t@"));

        if ($dominio !== '' && ! str_ends_with($valor, '@'.$dominio)) {
            throw new ReglaNegocioException("El correo debe pertenecer al dominio institucional @{$dominio}.", $campo);
        }

        return new self($valor);
    }

    /** Parte local (antes de la `@`). */
    public function usuario(): string
    {
        return strstr($this->valor, '@', true) ?: $this->valor;
    }

    public function __toString(): string
    {
        return $this->valor;
    }
}
