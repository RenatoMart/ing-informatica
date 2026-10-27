<?php

namespace App\Persistencia\Publicaciones;

use App\Dominio\Compartido\Excepciones\NoEncontradoException;
use App\Dominio\Compartido\Paginacion;
use App\Dominio\Compartido\ResultadoPaginado;
use App\Persistencia\Compartido\Repositorio;

/**
 * Lecturas públicas sobre `v_publico_publicaciones` (solo publicadas y ya visibles).
 */
class PublicacionPublicaRepositorio extends Repositorio
{
    /**
     * @return ResultadoPaginado<array<string, mixed>>
     */
    public function listar(?string $categoria, Paginacion $paginacion): ResultadoPaginado
    {
        $consulta = $this->tabla('v_publico_publicaciones')
            ->select(['id_publicacion', 'titulo', 'resumen', 'categoria', 'fecha_visible', 'imagen_portada'])
            ->orderByDesc('fecha_visible')
            ->orderByDesc('id_publicacion');

        if ($categoria !== null && $categoria !== '') {
            $consulta->where('categoria', $categoria);
        }

        return $this->paginador->paginar($consulta, $paginacion);
    }

    /**
     * @return array<string, mixed>
     *
     * @throws NoEncontradoException
     */
    public function detalle(int $id): array
    {
        $fila = $this->primeraOFallar(
            $this->tabla('v_publico_publicaciones')->where('id_publicacion', $id),
            'Publicación no encontrada.',
        );

        $fila['archivos'] = json_decode((string) $fila['archivos'], true) ?: [];

        return $fila;
    }
}
