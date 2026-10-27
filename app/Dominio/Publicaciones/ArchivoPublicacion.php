<?php

namespace App\Dominio\Publicaciones;

use App\Dominio\Compartido\Arreglable;
use App\Dominio\Compartido\Excepciones\ReglaNegocioException;

/**
 * Imagen de una publicación: ruta relativa y dimensiones (siempre 600×400 tras optimizar).
 */
final readonly class ArchivoPublicacion implements Arreglable
{
    public const ANCHO = 600;

    public const ALTO = 400;

    /**
     * @throws ReglaNegocioException
     */
    public function __construct(
        public string $ruta,
        public int $ancho = self::ANCHO,
        public int $alto = self::ALTO,
        public ?int $id = null,
    ) {
        if (trim($ruta) === '' || mb_strlen($ruta) > 255) {
            throw new ReglaNegocioException('La ruta del archivo no es válida.', 'imagen');
        }

        if ($ancho < 1 || $alto < 1) {
            throw new ReglaNegocioException('Las dimensiones de la imagen no son válidas.', 'imagen');
        }
    }

    /**
     * @param  array<string, mixed>  $fila  Fila de `archivo_publicacion` o elemento de `archivos_agregar`.
     */
    public static function desdeFila(array $fila): self
    {
        return new self(
            (string) ($fila['ruta_archivo'] ?? $fila['ruta']),
            (int) ($fila['ancho_px'] ?? $fila['ancho'] ?? self::ANCHO),
            (int) ($fila['alto_px'] ?? $fila['alto'] ?? self::ALTO),
            isset($fila['id_archivo']) ? (int) $fila['id_archivo'] : null,
        );
    }

    /**
     * @return array{id_archivo: int|null, ruta_archivo: string, ancho_px: int, alto_px: int}
     */
    public function aArreglo(): array
    {
        return [
            'id_archivo' => $this->id,
            'ruta_archivo' => $this->ruta,
            'ancho_px' => $this->ancho,
            'alto_px' => $this->alto,
        ];
    }
}
