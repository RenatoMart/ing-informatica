<?php

namespace App\Dominio\Revision;

/**
 * Política de revisión de una entidad: su tabla de transiciones y sus estados públicos.
 */
interface PoliticaRevision
{
    public function entidad(): EntidadRevisable;

    /**
     * Todos los estados del tipo ENUM de la entidad.
     *
     * @return list<string>
     */
    public function estados(): array;

    /**
     * @return list<Transicion>
     */
    public function transiciones(): array;

    /**
     * Estados visibles en el sitio público.
     *
     * @return list<string>
     */
    public function estadosPublicos(): array;

    /** Indica si el revisor puede tomar esa decisión sobre esta entidad. */
    public function admite(TipoDecision $decision): bool;
}
