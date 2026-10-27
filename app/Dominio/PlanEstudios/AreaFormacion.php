<?php

namespace App\Dominio\PlanEstudios;

/**
 * Área de formación del curso (`curso.area_formacion`).
 */
enum AreaFormacion: string
{
    case General = 'general';
    case Especifico = 'especifico';
    case Especialidad = 'especialidad';
}
