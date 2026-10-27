<?php

namespace App\Aplicacion\Compartido;

/**
 * Resultado de {@see ProcesadorImagenes}: bytes WebP listos para {@see AlmacenArchivos::guardarContenido()}.
 */
final readonly class ImagenProcesada
{
    public function __construct(
        public string $contenido,
        public int $ancho,
        public int $alto,
        public string $extension = 'webp',
    ) {}
}
