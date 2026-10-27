<?php

namespace App\Dominio\DocumentosAdmision;

use App\Dominio\Compartido\Excepciones\ReglaNegocioException;

/**
 * Objeto de valor del PDF de un documento oficial: mime `application/pdf` y 10 MB como máximo.
 */
final readonly class ArchivoPdf
{
    public const MIME = 'application/pdf';

    public const BYTES_MAXIMO = 10 * 1024 * 1024;

    private function __construct(public int $bytes) {}

    /**
     * @throws ReglaNegocioException
     */
    public static function desde(string $mime, int $bytes): self
    {
        if (strtolower($mime) !== self::MIME) {
            throw new ReglaNegocioException('El archivo debe ser un PDF.', 'archivo');
        }

        if ($bytes <= 0 || $bytes > self::BYTES_MAXIMO) {
            throw new ReglaNegocioException('El PDF no puede superar 10 MB.', 'archivo');
        }

        return new self($bytes);
    }
}
