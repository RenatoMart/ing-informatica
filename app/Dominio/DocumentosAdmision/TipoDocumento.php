<?php

namespace App\Dominio\DocumentosAdmision;

/**
 * Tipo de documento oficial (enum `tipo_documento` de la BD).
 */
enum TipoDocumento: string
{
    case Resolucion = 'resolucion';
    case Guia = 'guia';
    case Politica = 'politica';
}
