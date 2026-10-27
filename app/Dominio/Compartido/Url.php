<?php

namespace App\Dominio\Compartido;

use App\Dominio\Compartido\Excepciones\ReglaNegocioException;
use Stringable;

/**
 * Objeto de valor URL: absoluta, con esquema `https` obligatorio y de 255 caracteres como máximo.
 */
final readonly class Url implements Stringable
{
    public const LONGITUD_MAXIMA = 255;

    private function __construct(public string $valor) {}

    /**
     * @param  string  $campo  Campo al que se asocia el error 422.
     *
     * @throws ReglaNegocioException
     */
    public static function desde(string $valor, string $campo = 'url'): self
    {
        $valor = trim($valor);

        if ($valor === '') {
            throw new ReglaNegocioException('La URL es obligatoria.', $campo);
        }

        if (mb_strlen($valor) > self::LONGITUD_MAXIMA) {
            throw new ReglaNegocioException('La URL no puede superar 255 caracteres.', $campo);
        }

        $partes = parse_url($valor);

        if (
            filter_var($valor, FILTER_VALIDATE_URL) === false
            || ! is_array($partes)
            || strtolower($partes['scheme'] ?? '') !== 'https'
            || ($partes['host'] ?? '') === ''
        ) {
            throw new ReglaNegocioException('La URL debe ser válida y empezar por https://.', $campo);
        }

        return new self($valor);
    }

    /**
     * Igual que {@see desde()}, pero acepta vacío o null y devuelve null.
     *
     * @throws ReglaNegocioException
     */
    public static function opcional(?string $valor, string $campo = 'url'): ?self
    {
        if ($valor === null || trim($valor) === '') {
            return null;
        }

        return self::desde($valor, $campo);
    }

    public function __toString(): string
    {
        return $this->valor;
    }
}
