<?php

namespace App\Dominio\ConsultasVisitas;

/**
 * Estados de una consulta de contacto (4.7).
 */
enum EstadoConsulta: string
{
    case Recibida = 'recibida';
    case EnAtencion = 'en_atencion';
    case Atendida = 'atendida';
    case Descartada = 'descartada';
    case Derivada = 'derivada';
}
