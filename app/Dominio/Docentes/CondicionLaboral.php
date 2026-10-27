<?php

namespace App\Dominio\Docentes;

/**
 * Condición laboral del docente (literales de `condicion_laboral`).
 */
enum CondicionLaboral: string
{
    case Nombrado = 'nombrado';
    case Contratado = 'contratado';
}
