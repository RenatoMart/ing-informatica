<?php

namespace App\Aplicacion\Publicaciones;

use App\Aplicacion\Compartido\AlmacenArchivos;
use App\Aplicacion\Compartido\NotificadorRevision;
use App\Aplicacion\Compartido\ProcesadorImagenes;
use App\Dominio\Compartido\Excepciones\NoEncontradoException;
use App\Dominio\Compartido\Excepciones\ReglaNegocioException;
use App\Dominio\Compartido\Paginacion;
use App\Dominio\Compartido\ResultadoPaginado;
use App\Dominio\Publicaciones\ArchivoPublicacion;
use App\Dominio\Publicaciones\Publicacion;
use App\Dominio\Revision\AccionRevision;
use App\Dominio\Revision\DecisionRevision;
use App\Dominio\Revision\EntidadRevisable;
use App\Dominio\Revision\MaquinaEstadosRevision;
use App\Dominio\Revision\OperacionPendiente;
use App\Dominio\Revision\TipoDecision;
use App\Persistencia\Publicaciones\PublicacionRepositorio;
use DateTimeImmutable;
use DateTimeZone;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Throwable;

/**
 * Casos de uso del panel de publicaciones (HU2, P1/P2): CRUD, imágenes, envío a revisión,
 * baja, descarte y decisión del revisor. Cada escritura va en `DB::transaction` (un error de la función
 * `sp_*` deshace solo esa operación). Una publicada se edita como cambio pendiente: lo
 * publicado no se retira hasta que el Director aprueba.
 */
class PublicacionesServicio
{
    public function __construct(
        private readonly PublicacionRepositorio $repositorio,
        private readonly AlmacenArchivos $almacen,
        private readonly ProcesadorImagenes $imagenes,
        private readonly NotificadorRevision $notificador,
        private readonly MaquinaEstadosRevision $maquina = new MaquinaEstadosRevision,
    ) {}

    /**
     * @param  array{estado?: string|null, categoria?: string|null, q?: string|null}  $filtros
     * @return ResultadoPaginado<array<string, mixed>>
     */
    public function listar(array $filtros, Paginacion $paginacion): ResultadoPaginado
    {
        return $this->repositorio->listar($filtros, $paginacion)->mapear(function (array $fila): array {
            $fila['imagen_portada_url'] = $this->almacen->url($fila['imagen_portada']);
            unset($fila['imagen_portada']);

            return $fila;
        });
    }

    /**
     * Detalle con imágenes (con URL), cambios pendientes y observaciones de la última revisión.
     *
     * @return array<string, mixed>
     *
     * @throws NoEncontradoException
     */
    public function detalle(int $id): array
    {
        $publicacion = $this->repositorio->obtener($id);
        $datos = $publicacion->aArreglo();

        $datos['archivos'] = array_map(fn (ArchivoPublicacion $a): array => $this->archivoConUrl($a), $publicacion->archivos);

        if ($publicacion->cambios !== null) {
            $cambios = $publicacion->cambios->aArreglo();
            $cambios['archivos_agregar'] = array_map(fn (ArchivoPublicacion $a): array => [
                'url' => $this->almacen->url($a->ruta), 'ancho_px' => $a->ancho, 'alto_px' => $a->alto,
            ], $publicacion->cambios->archivosAgregar);
            $datos['cambios_pendientes'] = $cambios;
        }

        return $datos;
    }

    /**
     * @param  array{titulo: string, resumen?: string|null, contenido?: string|null, categoria?: string|null, fecha_publicacion_programada?: string|null}  $datos
     * @return int `id_publicacion` (queda en borrador).
     */
    public function crear(int $idEditor, array $datos): int
    {
        $this->validar($datos);

        return DB::transaction(fn (): int => $this->repositorio->crear(
            $idEditor, trim($datos['titulo']), $datos['resumen'] ?? null, $datos['contenido'] ?? null,
            $datos['categoria'] ?? null, $datos['fecha_publicacion_programada'] ?? null,
        ));
    }

    /**
     * @param  array{titulo: string, resumen?: string|null, contenido?: string|null, categoria?: string|null, fecha_publicacion_programada?: string|null}  $datos
     * @return string `directo` (borrador) o `cambio_pendiente` (publicada).
     */
    public function actualizar(int $idEditor, int $id, array $datos): string
    {
        $this->validar($datos);

        $modo = DB::transaction(fn (): string => $this->repositorio->actualizar(
            $idEditor, $id, trim($datos['titulo']), $datos['resumen'] ?? null, $datos['contenido'] ?? null,
            $datos['categoria'] ?? null, $datos['fecha_publicacion_programada'] ?? null,
        ));

        if ($modo === 'cambio_pendiente') {
            $this->notificador->enviadoARevision(EntidadRevisable::Publicacion, $id, trim($datos['titulo']), 'cambio', $idEditor);
        }

        return $modo;
    }

    /**
     * Optimiza la imagen (600×400 WebP), la guarda y la asocia a la publicación.
     *
     * @return array{id_archivo: int|null, url: string, ancho_px: int, alto_px: int, pendiente: bool}
     *                                                                                                `pendiente` es verdadero si la publicación ya está publicada (la imagen espera la aprobación).
     */
    public function subirImagen(int $idEditor, int $id, UploadedFile $archivo): array
    {
        $publicacion = $this->repositorio->obtener($id);
        $operacion = $this->operacion($publicacion);

        $this->maquina->transicion(
            EntidadRevisable::Publicacion, $publicacion->estado->value, $operacion,
            $publicacion->estado->editaDirecto() ? AccionRevision::Guardar : AccionRevision::ProponerCambio,
        );

        $total = count($publicacion->archivos)
            + count($publicacion->cambios->archivosAgregar ?? [])
            - count($publicacion->cambios->archivosQuitar ?? []);
        Publicacion::validarCupoArchivos($total);

        $procesada = $this->imagenes->publicacion($archivo, 'imagen');
        $ruta = $this->almacen->guardarContenido($procesada->contenido, "publicaciones/{$id}", $procesada->extension);

        try {
            $idArchivo = DB::transaction(fn (): int => $this->repositorio->agregarArchivo(
                $idEditor, $id, new ArchivoPublicacion($ruta, $procesada->ancho, $procesada->alto),
            ));
        } catch (Throwable $error) {
            $this->almacen->descartar($ruta);

            throw $error;
        }

        return [
            'id_archivo' => $idArchivo === 0 ? null : $idArchivo,
            'url' => (string) $this->almacen->url($ruta),
            'ancho_px' => $procesada->ancho,
            'alto_px' => $procesada->alto,
            'pendiente' => $idArchivo === 0,
        ];
    }

    /**
     * Quita una imagen: en borrador se borra (y su archivo del disco tras el commit); en una publicada
     * queda como cambio pendiente y el archivo se conserva.
     *
     * @throws NoEncontradoException
     */
    public function quitarImagen(int $idEditor, int $id, int $idArchivo): void
    {
        if ($this->repositorio->publicacionDeArchivo($idArchivo) !== $id) {
            throw new NoEncontradoException('Archivo no encontrado.');
        }

        DB::transaction(function () use ($idEditor, $idArchivo): void {
            $this->almacen->eliminarSiHuerfano($this->repositorio->quitarArchivo($idEditor, $idArchivo));
        });
    }

    /**
     * @throws ReglaNegocioException
     */
    public function enviarRevision(int $idEditor, int $id): void
    {
        $publicacion = $this->repositorio->obtener($id);

        $this->maquina->transicion(EntidadRevisable::Publicacion, $publicacion->estado->value, $this->operacion($publicacion), AccionRevision::EnviarRevision);
        $publicacion->validarParaEnviar();

        DB::transaction(fn () => $this->repositorio->enviarRevision($idEditor, $id));
        $this->notificador->enviadoARevision(EntidadRevisable::Publicacion, $id, $publicacion->titulo, 'revision', $idEditor);
    }

    public function solicitarBaja(int $idEditor, int $id): void
    {
        DB::transaction(fn () => $this->repositorio->solicitarBaja($idEditor, $id));
        $this->notificador->enviadoARevision(EntidadRevisable::Publicacion, $id, $this->repositorio->obtener($id)->titulo, 'baja', $idEditor);
    }

    public function descartar(int $idEditor, int $id): void
    {
        DB::transaction(fn () => $this->repositorio->descartar($idEditor, $id));
    }

    /**
     * Decisión del revisor (aprobar, observar o descartar) validada con la máquina de estados común.
     *
     * @return string Estado resultante.
     */
    public function decidir(int $idRevisor, int $id, TipoDecision $tipo, ?string $observaciones = null): string
    {
        $publicacion = $this->repositorio->obtener($id);
        [$idEditor, $idEditorCambio] = $this->repositorio->idEditorYCambio($id);

        $decision = new DecisionRevision($tipo, $idRevisor, $idEditor, $observaciones, $idEditorCambio);
        $this->maquina->transicion(EntidadRevisable::Publicacion, $publicacion->estado->value, $this->operacion($publicacion), $tipo->accion());

        $estado = DB::transaction(fn (): string => $this->repositorio->decidir($idRevisor, $id, $tipo->value, $decision->observaciones));
        $this->notificador->decisionTomada(EntidadRevisable::Publicacion, $id, $publicacion->titulo, $idEditorCambio ?? $idEditor, $tipo, $decision->observaciones);

        return $estado;
    }

    /**
     * @param  array<string, mixed>  $datos
     */
    private function validar(array $datos): void
    {
        $zona = new DateTimeZone((string) config('portal.zona_horaria', 'America/Lima'));
        $fecha = ($datos['fecha_publicacion_programada'] ?? null) === null
            ? null
            : new DateTimeImmutable((string) $datos['fecha_publicacion_programada'], $zona);

        Publicacion::validarCampos(
            (string) ($datos['titulo'] ?? ''),
            $datos['resumen'] ?? null,
            $datos['categoria'] ?? null,
            $fecha,
            new DateTimeImmutable('today', $zona),
        );
    }

    private function operacion(Publicacion $publicacion): ?OperacionPendiente
    {
        return $publicacion->operacionPendiente === null ? null : OperacionPendiente::from($publicacion->operacionPendiente);
    }

    /**
     * @return array{id_archivo: int|null, url: string|null, ancho_px: int, alto_px: int}
     */
    private function archivoConUrl(ArchivoPublicacion $archivo): array
    {
        return ['id_archivo' => $archivo->id, 'url' => $this->almacen->url($archivo->ruta), 'ancho_px' => $archivo->ancho, 'alto_px' => $archivo->alto];
    }
}
