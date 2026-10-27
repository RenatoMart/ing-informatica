<?php

namespace App\Persistencia\Docentes;

/**
 * Normaliza el texto de búsqueda igual que `translate(lower(col), 'áéíóúüñ', 'aeiouun')` en SQL,
 * de modo que la búsqueda no distinga mayúsculas ni tildes (la BD no tiene la extensión `unaccent`).
 */
final class BusquedaTexto
{
    public static function patron(string $texto): string
    {
        $normalizado = strtr(mb_strtolower(trim($texto)), ['á' => 'a', 'é' => 'e', 'í' => 'i', 'ó' => 'o', 'ú' => 'u', 'ü' => 'u', 'ñ' => 'n']);

        return addcslashes($normalizado, '%_\\');
    }
}
