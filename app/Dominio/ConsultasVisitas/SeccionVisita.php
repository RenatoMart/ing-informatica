<?php

namespace App\Dominio\ConsultasVisitas;

/**
 * Secciones del sitio que registran visitas. Las tres últimas son EXTRA de dominio.
 */
enum SeccionVisita: string
{
    case Admision = 'admision';
    case PlanEstudios = 'plan_estudios';
    case Docentes = 'docentes';
    case Documentos = 'documentos';
    case Contacto = 'contacto';
    case Inicio = 'inicio';
    case Noticias = 'noticias';
    case Busqueda = 'busqueda';
}
