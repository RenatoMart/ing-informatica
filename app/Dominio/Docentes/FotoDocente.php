<?php

namespace App\Dominio\Docentes;

use App\Dominio\Compartido\Excepciones\ReglaNegocioException;

/**
 * Reglas de archivo de la foto de un docente: jpg/jpeg/png/webp (mime real), ≤5 MB y mínimo 300×300 px.
 */
final readonly class FotoDocente
{
    public const MIMES = ['image/jpeg', 'image/png', 'image/webp'];

    public const MAX_BYTES = 5 * 1024 * 1024;

    public const MIN_LADO = 300;

    public const LADO_MAXIMO = 900;

    /**
     * @throws ReglaNegocioException
     */
    public function __construct(public string $mime, public int $bytes, public int $ancho, public int $alto, string $campo = 'foto')
    {
        if (! in_array($mime, self::MIMES, true)) {
            throw new ReglaNegocioException('La foto debe ser JPG, PNG o WebP.', $campo);
        }

        if ($bytes > self::MAX_BYTES) {
            throw new ReglaNegocioException('La foto no puede superar 5 MB.', $campo);
        }

        if ($ancho < self::MIN_LADO || $alto < self::MIN_LADO) {
            throw new ReglaNegocioException('La foto debe medir al menos 300×300 px.', $campo);
        }
    }

    /**
     * Dimensiones resultantes tras reducir (nunca se amplía) a 900 px por el lado mayor.
     *
     * @return array{0: int, 1: int}
     */
    public function dimensionesFinales(): array
    {
        $mayor = max($this->ancho, $this->alto);

        if ($mayor <= self::LADO_MAXIMO) {
            return [$this->ancho, $this->alto];
        }

        $factor = self::LADO_MAXIMO / $mayor;

        return [(int) round($this->ancho * $factor), (int) round($this->alto * $factor)];
    }
}
