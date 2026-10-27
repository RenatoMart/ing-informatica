<?php

namespace App\Aplicacion\Publicaciones;

use App\Aplicacion\Compartido\AlmacenArchivos;
use App\Dominio\Compartido\Excepciones\NoEncontradoException;
use App\Dominio\Compartido\Paginacion;
use App\Dominio\Compartido\ResultadoPaginado;
use App\Persistencia\Publicaciones\PublicacionPublicaRepositorio;

/**
 * Listado y detalle públicos de publicaciones (solo `publicada` y ya visible).
 */
class ConsultaPublicacionesServicio
{
    public function __construct(
        private readonly PublicacionPublicaRepositorio $repositorio,
        private readonly AlmacenArchivos $almacen,
    ) {}

    /**
     * @return ResultadoPaginado<array<string, mixed>>
     */
    public function listar(?string $categoria, Paginacion $paginacion): ResultadoPaginado
    {
        return $this->repositorio->listar($categoria, $paginacion)->mapear(fn (array $fila): array => [
            'id_publicacion' => (int) $fila['id_publicacion'],
            'titulo' => $fila['titulo'],
            'resumen' => $fila['resumen'],
            'categoria' => $fila['categoria'],
            'fecha_visible' => $fila['fecha_visible'],
            'imagen_url' => $this->almacen->url($fila['imagen_portada']),
        ]);
    }

    /**
     * @return array<string, mixed>
     *
     * @throws NoEncontradoException
     */
    public function detalle(int $id): array
    {
        $fila = $this->repositorio->detalle($id);

        return [
            'id_publicacion' => (int) $fila['id_publicacion'],
            'titulo' => $fila['titulo'],
            'resumen' => $fila['resumen'],
            'contenido' => $fila['contenido'],
            'categoria' => $fila['categoria'],
            'fecha_visible' => $fila['fecha_visible'],
            'imagen_url' => $this->almacen->url($fila['imagen_portada']),
            'imagenes' => array_map(fn (array $a): array => [
                'id_archivo' => (int) $a['id_archivo'],
                'url' => $this->almacen->url($a['ruta_archivo']),
                'ancho_px' => $a['ancho_px'],
                'alto_px' => $a['alto_px'],
            ], $fila['archivos']),
        ];
    }
}
