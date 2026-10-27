<?php

namespace App\Dominio\DocumentosAdmision;

use App\Dominio\Compartido\Arreglable;
use App\Dominio\Compartido\Excepciones\ReglaNegocioException;
use App\Dominio\Compartido\Url;
use DateTimeImmutable;

/**
 * Cabecera de una campaña de admisión (HU5, P8): año, proceso (≤ 50, p. ej. `I`/`II`),
 * inicio ≤ fin y URLs https. Las URLs y las fechas pueden estar vacías en el borrador;
 * `sp_campana_validar` exige que estén completas antes de enviar a revisión.
 * Solo se edita en `borrador` ({@see EstadoCampana::esEditable()}) y solo una campaña es vigente.
 */
final readonly class CampanaAdmision implements Arreglable
{
    public const PROCESO_MAXIMO = 50;

    private function __construct(
        public int $anio,
        public ?string $proceso,
        public ?DateTimeImmutable $fechaInicio,
        public ?DateTimeImmutable $fechaFin,
        public ?Url $urlPortal,
        public ?Url $urlEstadisticas,
    ) {}

    /**
     * @throws ReglaNegocioException
     */
    public static function crear(
        int $anio,
        ?string $proceso,
        ?DateTimeImmutable $fechaInicio,
        ?DateTimeImmutable $fechaFin,
        ?string $urlPortal,
        ?string $urlEstadisticas,
    ): self {
        if ($anio < 2000 || $anio > 2100) {
            throw new ReglaNegocioException('El año de la campaña no es válido.', 'anio');
        }

        $proceso = $proceso === null ? null : trim($proceso);
        $proceso = $proceso === '' ? null : $proceso;

        if ($proceso !== null && mb_strlen($proceso) > self::PROCESO_MAXIMO) {
            throw new ReglaNegocioException('El proceso no puede superar 50 caracteres.', 'proceso');
        }

        if ($fechaInicio !== null && $fechaFin !== null && $fechaFin < $fechaInicio) {
            throw new ReglaNegocioException('La fecha de fin no puede ser anterior a la de inicio.', 'fecha_fin');
        }

        return new self(
            $anio,
            $proceso,
            $fechaInicio,
            $fechaFin,
            Url::opcional($urlPortal, 'url_portal'),
            Url::opcional($urlEstadisticas, 'url_estadisticas'),
        );
    }

    /** `true` si la campaña ya terminó antes de `$hoy` (se cierra por tarea programada). */
    public function haTerminado(DateTimeImmutable $hoy): bool
    {
        return $this->fechaFin !== null && $this->fechaFin->format('Y-m-d') < $hoy->format('Y-m-d');
    }

    /**
     * @return array<string, mixed>
     */
    public function aArreglo(): array
    {
        return [
            'anio' => $this->anio,
            'proceso' => $this->proceso,
            'fecha_inicio' => $this->fechaInicio?->format('Y-m-d'),
            'fecha_fin' => $this->fechaFin?->format('Y-m-d'),
            'url_portal' => $this->urlPortal?->valor,
            'url_estadisticas' => $this->urlEstadisticas?->valor,
        ];
    }
}
