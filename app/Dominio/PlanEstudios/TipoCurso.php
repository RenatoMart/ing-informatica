<?php

namespace App\Dominio\PlanEstudios;

/**
 * Tipo de curso (enum `tipo_curso` de la BD).
 */
enum TipoCurso: string
{
    case Obligatorio = 'obligatorio';
    case Electivo = 'electivo';
}
