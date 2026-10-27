<?php

namespace App\Dominio\PlanEstudios;

use App\Dominio\Compartido\Excepciones\ReglaNegocioException;

/**
 * Objeto de valor: conjunto de cursos requeridos por un curso (sin repetidos ni él mismo).
 */
final class Prerrequisitos
{
    /** @var list<int> */
    public readonly array $idsRequeridos;

    /**
     * @param  list<int>  $idsRequeridos
     *
     * @throws ReglaNegocioException
     */
    public function __construct(public readonly int $idCurso, array $idsRequeridos)
    {
        $ids = array_values(array_unique(array_map('intval', $idsRequeridos)));

        if (in_array($idCurso, $ids, true)) {
            throw new ReglaNegocioException('Un curso no puede ser prerrequisito de sí mismo.', 'prerrequisitos');
        }

        sort($ids);
        $this->idsRequeridos = $ids;
    }
}
