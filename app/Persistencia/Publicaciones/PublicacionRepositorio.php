<?php

namespace App\Persistencia\Publicaciones;

use App\Dominio\Compartido\Excepciones\NoEncontradoException;
use App\Dominio\Compartido\Paginacion;
use App\Dominio\Compartido\ResultadoPaginado;
use App\Dominio\Publicaciones\ArchivoPublicacion;
use App\Dominio\Publicaciones\CambiosPublicacion;
use App\Dominio\Publicaciones\EstadoPublicacion;
use App\Dominio\Publicaciones\Publicacion;
use App\Persistencia\Compartido\ArgumentoSql;
use App\Persistencia\Compartido\Repositorio;
use DateTimeImmutable;
use Illuminate\Support\Facades\DB;

/**
 * Panel de publicaciones: lecturas con Query Builder y escrituras solo con `sp_publicacion_*`.
 */
class PublicacionRepositorio extends Repositorio
{
    /**
     * Listado paginado del panel. Cada fila lleva `imagen_portada` (ruta relativa) para que la capa
     * de aplicación arme `imagen_portada_url`.
     *
     * @param  array{estado?: string|null, categoria?: string|null, q?: string|null}  $filtros
     * @return ResultadoPaginado<array<string, mixed>>
     */
    public function listar(array $filtros, Paginacion $paginacion): ResultadoPaginado
    {
        $consulta = $this->tabla('publicacion as p')
            ->join('usuario as u', 'u.id_usuario', '=', 'p.id_editor')
            ->select([
                'p.id_publicacion', 'p.titulo', 'p.categoria', DB::raw('p.estado::text as estado'),
                'p.operacion_pendiente', 'p.fecha_creacion', 'p.fecha_publicacion_programada',
                DB::raw("(u.nombres || ' ' || u.apellidos) as editor"),
                DB::raw('(select a.ruta_archivo from archivo_publicacion a where a.id_publicacion = p.id_publicacion order by a.id_archivo limit 1) as imagen_portada'),
            ])
            ->orderByDesc('p.id_publicacion');

        if (! empty($filtros['estado'])) {
            $consulta->whereRaw('p.estado::text = ?', [$filtros['estado']]);
        }

        if (! empty($filtros['categoria'])) {
            $consulta->where('p.categoria', $filtros['categoria']);
        }

        if (! empty($filtros['q'])) {
            $consulta->where('p.titulo', 'ilike', '%'.addcslashes((string) $filtros['q'], '%_\\').'%');
        }

        return $this->paginador->paginar($consulta, $paginacion);
    }

    /**
     * @throws NoEncontradoException
     */
    public function obtener(int $id): Publicacion
    {
        $fila = $this->primeraOFallar(
            $this->tabla('publicacion as p')
                ->join('usuario as u', 'u.id_usuario', '=', 'p.id_editor')
                ->where('p.id_publicacion', $id)
                ->select(['p.*', DB::raw('p.estado::text as estado_texto'), DB::raw("(u.nombres || ' ' || u.apellidos) as editor")]),
            'Publicación no encontrada.',
        );

        $archivos = array_map(
            ArchivoPublicacion::desdeFila(...),
            $this->todas($this->tabla('archivo_publicacion')->where('id_publicacion', $id)->orderBy('id_archivo')),
        );

        $json = $fila['cambios_pendientes'] === null ? null : json_decode((string) $fila['cambios_pendientes'], true);

        return new Publicacion(
            (int) $fila['id_publicacion'],
            (string) $fila['titulo'],
            $fila['resumen'],
            $fila['contenido'],
            $fila['categoria'],
            EstadoPublicacion::from((string) $fila['estado_texto']),
            $fila['fecha_publicacion_programada'] === null ? null : new DateTimeImmutable((string) $fila['fecha_publicacion_programada']),
            $archivos,
            CambiosPublicacion::desdeJson(is_array($json) ? $json : null),
            $fila['operacion_pendiente'],
            $fila['observaciones_revision'],
            (string) $fila['editor'],
            (string) $fila['fecha_creacion'],
        );
    }

    /** `id_editor` original de la publicación (para la decisión del revisor). */
    public function idEditor(int $id): int
    {
        return $this->idEditorYCambio($id)[0];
    }

    /**
     * @return array{0: int, 1: int|null} Editor original y editor del cambio/baja pendiente.
     *
     * @throws NoEncontradoException
     */
    public function idEditorYCambio(int $id): array
    {
        $fila = $this->primeraOFallar(
            $this->tabla('publicacion')->where('id_publicacion', $id)
                ->select(['id_editor', DB::raw("(cambios_pendientes ->> '_id_editor')::int as id_editor_cambio")]),
            'Publicación no encontrada.',
        );

        return [(int) $fila['id_editor'], $fila['id_editor_cambio'] === null ? null : (int) $fila['id_editor_cambio']];
    }

    public function crear(int $idEditor, string $titulo, ?string $resumen, ?string $contenido, ?string $categoria, ?string $fechaProgramada): int
    {
        return (int) $this->sp->escalar('sp_publicacion_crear', [
            $idEditor, $titulo, $resumen, $contenido, $categoria, $this->fecha($fechaProgramada),
        ]);
    }

    /**
     * @return string `directo` o `cambio_pendiente`.
     */
    public function actualizar(int $idEditor, int $id, string $titulo, ?string $resumen, ?string $contenido, ?string $categoria, ?string $fechaProgramada): string
    {
        return (string) $this->sp->escalar('sp_publicacion_actualizar', [
            $idEditor, $id, $titulo, $resumen, $contenido, $categoria, $this->fecha($fechaProgramada),
        ]);
    }

    /**
     * @return int `id_archivo`, o 0 si la imagen quedó como cambio pendiente de una publicación publicada.
     */
    public function agregarArchivo(int $idEditor, int $id, ArchivoPublicacion $archivo): int
    {
        return (int) $this->sp->escalar('sp_publicacion_agregar_archivo', [
            $idEditor, $id, $archivo->ruta, $archivo->ancho, $archivo->alto,
        ]);
    }

    /**
     * @return string|null Ruta del archivo que se debe borrar del disco (null si queda pendiente).
     */
    public function quitarArchivo(int $idEditor, int $idArchivo): ?string
    {
        $ruta = $this->sp->escalar('sp_publicacion_quitar_archivo', [$idEditor, $idArchivo]);

        return $ruta === null ? null : (string) $ruta;
    }

    /** `id_publicacion` al que pertenece un archivo. */
    public function publicacionDeArchivo(int $idArchivo): ?int
    {
        $id = $this->tabla('archivo_publicacion')->where('id_archivo', $idArchivo)->value('id_publicacion');

        return $id === null ? null : (int) $id;
    }

    public function enviarRevision(int $idEditor, int $id): void
    {
        $this->sp->ejecutar('sp_publicacion_enviar_revision', [$idEditor, $id]);
    }

    public function solicitarBaja(int $idEditor, int $id): void
    {
        $this->sp->ejecutar('sp_publicacion_solicitar_baja', [$idEditor, $id]);
    }

    public function descartar(int $idEditor, int $id): void
    {
        $this->sp->ejecutar('sp_publicacion_descartar', [$idEditor, $id]);
    }

    /**
     * @return string Estado nuevo.
     */
    public function decidir(int $idRevisor, int $id, string $decision, ?string $observaciones): string
    {
        return (string) $this->sp->escalar('sp_publicacion_decidir', [$idRevisor, $id, $decision, $observaciones]);
    }

    private function fecha(?string $fecha): ArgumentoSql
    {
        return ArgumentoSql::conTipo($fecha, 'date');
    }
}
