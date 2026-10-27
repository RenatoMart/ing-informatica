<?php

namespace App\Dominio\Publicaciones;

use App\Dominio\Compartido\Arreglable;

/**
 * Cambios propuestos sobre una publicación ya publicada (JSON `cambios_pendientes`):
 * campos editables, imágenes por agregar (`archivos_agregar`) e ids por quitar (`archivos_quitar`).
 * Una baja pendiente solo lleva `_id_editor`, sin campos.
 */
final readonly class CambiosPublicacion implements Arreglable
{
    /**
     * @param  array<string, mixed>  $campos  Subconjunto de titulo, resumen, contenido, categoria, fecha_publicacion_programada.
     * @param  list<ArchivoPublicacion>  $archivosAgregar
     * @param  list<int>  $archivosQuitar
     */
    public function __construct(
        public array $campos = [],
        public array $archivosAgregar = [],
        public array $archivosQuitar = [],
        public ?int $idEditor = null,
    ) {}

    /**
     * @param  array<string, mixed>|null  $json
     */
    public static function desdeJson(?array $json): ?self
    {
        if ($json === null) {
            return null;
        }

        $campos = array_intersect_key($json, array_flip(['titulo', 'resumen', 'contenido', 'categoria', 'fecha_publicacion_programada']));

        $agregar = array_map(
            static fn (array $a): ArchivoPublicacion => ArchivoPublicacion::desdeFila($a),
            array_values(array_filter((array) ($json['archivos_agregar'] ?? []), is_array(...))),
        );

        return new self(
            $campos,
            $agregar,
            array_map(intval(...), array_values((array) ($json['archivos_quitar'] ?? []))),
            isset($json['_id_editor']) ? (int) $json['_id_editor'] : null,
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function aArreglo(): array
    {
        return $this->campos + [
            'archivos_agregar' => array_map(static fn (ArchivoPublicacion $a): array => $a->aArreglo(), $this->archivosAgregar),
            'archivos_quitar' => $this->archivosQuitar,
        ];
    }
}
