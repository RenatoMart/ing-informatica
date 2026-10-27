<?php

namespace App\Dominio\Compartido;

/**
 * Entidad u objeto de valor que se entrega a la capa HTTP como arreglo DTO
 * (claves en `snake_case`, iguales a las columnas; sección 0).
 */
interface Arreglable
{
    /**
     * @return array<string, mixed>
     */
    public function aArreglo(): array;
}
