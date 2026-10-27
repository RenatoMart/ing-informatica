<?php

namespace App\Dominio\Publicaciones;

use App\Dominio\Compartido\Arreglable;
use App\Dominio\Compartido\Excepciones\ReglaNegocioException;
use DateTimeImmutable;

/**
 * Entidad Publicación (HU2). Reglas replicadas en `sp_publicacion_*` (defensa en profundidad):
 * título de 5 a 200 caracteres, resumen ≤500, categoría ≤100, fecha programada ≥ hoy; para enviar a
 * revisión: resumen y categoría obligatorios y al menos 1 imagen; máximo 6 imágenes.
 */
final readonly class Publicacion implements Arreglable
{
    public const TITULO_MIN = 5;

    public const TITULO_MAX = 200;

    public const RESUMEN_MAX = 500;

    public const CATEGORIA_MAX = 100;

    public const MAX_ARCHIVOS = 6;

    /**
     * @param  list<ArchivoPublicacion>  $archivos
     */
    public function __construct(
        public ?int $id,
        public string $titulo,
        public ?string $resumen,
        public ?string $contenido,
        public ?string $categoria,
        public EstadoPublicacion $estado,
        public ?DateTimeImmutable $fechaProgramada,
        public array $archivos = [],
        public ?CambiosPublicacion $cambios = null,
        public ?string $operacionPendiente = null,
        public ?string $observacionesRevision = null,
        public ?string $editor = null,
        public ?string $fechaCreacion = null,
    ) {}

    /**
     * Valida los campos editables de una publicación (crear o editar).
     *
     * @param  DateTimeImmutable  $hoy  Fecha de hoy en America/Lima (la aporta la capa de aplicación).
     *
     * @throws ReglaNegocioException
     */
    public static function validarCampos(
        string $titulo,
        ?string $resumen,
        ?string $categoria,
        ?DateTimeImmutable $fechaProgramada,
        DateTimeImmutable $hoy,
    ): void {
        $largo = mb_strlen(trim($titulo));

        if ($largo < self::TITULO_MIN || $largo > self::TITULO_MAX) {
            throw new ReglaNegocioException('El título debe tener entre 5 y 200 caracteres.', 'titulo');
        }

        if (mb_strlen($resumen ?? '') > self::RESUMEN_MAX) {
            throw new ReglaNegocioException('El resumen no puede superar 500 caracteres.', 'resumen');
        }

        if (mb_strlen($categoria ?? '') > self::CATEGORIA_MAX) {
            throw new ReglaNegocioException('La categoría no puede superar 100 caracteres.', 'categoria');
        }

        if ($fechaProgramada !== null && $fechaProgramada->format('Y-m-d') < $hoy->format('Y-m-d')) {
            throw new ReglaNegocioException('La fecha programada no puede ser anterior a hoy.', 'fecha_publicacion_programada');
        }
    }

    /**
     * Si se puede adjuntar una imagen más (considera las pendientes por agregar y quitar).
     *
     * @throws ReglaNegocioException
     */
    public static function validarCupoArchivos(int $actuales): void
    {
        if ($actuales >= self::MAX_ARCHIVOS) {
            throw new ReglaNegocioException('Una publicación admite como máximo 6 archivos.', 'archivos');
        }
    }

    /**
     * Requisitos para pasar de borrador a revisión.
     *
     * @throws ReglaNegocioException
     */
    public function validarParaEnviar(): void
    {
        if (trim($this->resumen ?? '') === '') {
            throw new ReglaNegocioException('El resumen es obligatorio para enviar a revisión.', 'resumen');
        }

        if (trim($this->categoria ?? '') === '') {
            throw new ReglaNegocioException('La categoría es obligatoria para enviar a revisión.', 'categoria');
        }

        if ($this->archivos === []) {
            throw new ReglaNegocioException('Debe adjuntar al menos una imagen.', 'archivos');
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function aArreglo(): array
    {
        return [
            'id_publicacion' => $this->id,
            'titulo' => $this->titulo,
            'resumen' => $this->resumen,
            'contenido' => $this->contenido,
            'categoria' => $this->categoria,
            'estado' => $this->estado->value,
            'operacion_pendiente' => $this->operacionPendiente,
            'fecha_publicacion_programada' => $this->fechaProgramada?->format('Y-m-d'),
            'archivos' => array_map(static fn (ArchivoPublicacion $a): array => $a->aArreglo(), $this->archivos),
            'cambios_pendientes' => $this->cambios?->aArreglo(),
            'observaciones_revision' => $this->observacionesRevision,
            'editor' => $this->editor,
            'fecha_creacion' => $this->fechaCreacion,
        ];
    }
}
