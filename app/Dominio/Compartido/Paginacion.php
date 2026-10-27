<?php

namespace App\Dominio\Compartido;

/**
 * Parámetros de paginación de los listados (`?pagina=1&por_pagina=20`, máximo 100).
 * Los valores fuera de rango se normalizan en lugar de rechazarse.
 */
final readonly class Paginacion
{
    public const POR_PAGINA_DEFECTO = 20;

    public const POR_PAGINA_MAXIMO = 100;

    private function __construct(public int $pagina, public int $porPagina) {}

    /**
     * Construye la paginación desde la entrada cruda de la petición.
     */
    public static function desde(mixed $pagina = null, mixed $porPagina = null): self
    {
        $pagina = is_numeric($pagina) ? (int) $pagina : 1;
        $porPagina = is_numeric($porPagina) ? (int) $porPagina : self::POR_PAGINA_DEFECTO;

        return new self(
            max(1, $pagina),
            min(self::POR_PAGINA_MAXIMO, max(1, $porPagina)),
        );
    }

    /** Filas que se saltan antes de la página actual (OFFSET). */
    public function desplazamiento(): int
    {
        return ($this->pagina - 1) * $this->porPagina;
    }
}
