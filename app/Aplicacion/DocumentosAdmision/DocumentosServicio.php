<?php

namespace App\Aplicacion\DocumentosAdmision;

use App\Aplicacion\Compartido\AlmacenArchivos;
use App\Aplicacion\Compartido\NotificadorRevision;
use App\Dominio\Compartido\Excepciones\ExcepcionDominio;
use App\Dominio\Compartido\Excepciones\ReglaNegocioException;
use App\Dominio\Compartido\Paginacion;
use App\Dominio\Compartido\ResultadoPaginado;
use App\Dominio\DocumentosAdmision\ArchivoPdf;
use App\Dominio\DocumentosAdmision\DocumentoOficial;
use App\Dominio\DocumentosAdmision\EstadoDocumento;
use App\Dominio\DocumentosAdmision\TipoDocumento;
use App\Dominio\Revision\AccionRevision;
use App\Dominio\Revision\DecisionRevision;
use App\Dominio\Revision\EntidadRevisable;
use App\Dominio\Revision\MaquinaEstadosRevision;
use App\Dominio\Revision\TipoDecision;
use App\Persistencia\DocumentosAdmision\DocumentoPublicoRepositorio;
use App\Persistencia\DocumentosAdmision\DocumentoRepositorio;
use DateTimeImmutable;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Throwable;

/**
 * Documentos oficiales (HU5, P7): registro con PDF, edición del no publicado, reenvío,
 * decisión del revisor, cadena de versiones, lectura pública y tareas de vencimiento.
 */
class DocumentosServicio
{
    public function __construct(
        private readonly DocumentoRepositorio $documentos,
        private readonly DocumentoPublicoRepositorio $publicos,
        private readonly AlmacenArchivos $archivos,
        private readonly NotificadorRevision $notificador,
        private readonly AvisosDocumentosAdmision $avisos,
        private readonly MaquinaEstadosRevision $maquina,
    ) {}

    /**
     * @param  array{tipo?: string|null, estado?: string|null, q?: string|null}  $filtros
     * @return ResultadoPaginado<array<string, mixed>>
     */
    public function listar(array $filtros, Paginacion $paginacion): ResultadoPaginado
    {
        return $this->documentos->listar($filtros, $paginacion)->mapear(fn (array $fila): array => $this->presentar($fila));
    }

    /**
     * Detalle con `archivo_url` y la cadena de versiones (anteriores y posteriores).
     *
     * @return array<string, mixed>
     */
    public function detalle(int $id): array
    {
        $documento = $this->presentar($this->documentos->obtener($id));
        $documento['versiones_anteriores'] = array_map($this->presentar(...), $this->documentos->versionesAnteriores($id));
        $documento['versiones_posteriores'] = array_map($this->presentar(...), $this->documentos->versionesPosteriores($id));

        return $documento;
    }

    /**
     * Registra un documento nuevo (entra en `en_revision`) con su PDF y avisa a los revisores.
     *
     * @param  array{tipo: string, numero: string, titulo: string, fecha_emision: string, id_departamento_emisor: int|string, fecha_vigencia: string, id_version_anterior?: int|string|null}  $datos
     * @return int `id_documento`
     *
     * @throws ExcepcionDominio
     */
    public function registrar(int $idEditor, array $datos, UploadedFile $archivo): int
    {
        $documento = $this->armar($datos);
        ArchivoPdf::desde((string) $archivo->getMimeType(), (int) $archivo->getSize());

        $idAnterior = isset($datos['id_version_anterior']) && $datos['id_version_anterior'] !== '' ? (int) $datos['id_version_anterior'] : null;

        if ($idAnterior !== null) {
            $this->validarVersionAnterior($documento, $idAnterior);
        }

        $ruta = $this->archivos->guardarArchivo($archivo, 'documentos', 'pdf');

        try {
            $id = $this->documentos->registrar($idEditor, $documento, $ruta, $idAnterior);
        } catch (Throwable $error) {
            $this->archivos->descartar($ruta);

            throw $error;
        }

        $this->notificador->enviadoARevision(EntidadRevisable::Documento, $id, $this->titulo($documento), idExcluido: $idEditor);

        return $id;
    }

    /**
     * Edita un documento `no_publicado`; si llega un PDF nuevo, el anterior se borra tras el commit.
     *
     * @param  array{tipo: string, numero: string, titulo: string, fecha_emision: string, id_departamento_emisor: int|string, fecha_vigencia: string}  $datos
     *
     * @throws ExcepcionDominio
     */
    public function actualizar(int $idEditor, int $id, array $datos, ?UploadedFile $archivo = null): void
    {
        $documento = $this->armar($datos);

        $estado = EstadoDocumento::from((string) $this->documentos->obtener($id)['estado']);
        $this->maquina->siguiente(EntidadRevisable::Documento, $estado->value, null, AccionRevision::Guardar);

        $ruta = null;

        if ($archivo !== null) {
            ArchivoPdf::desde((string) $archivo->getMimeType(), (int) $archivo->getSize());
            $ruta = $this->archivos->guardarArchivo($archivo, 'documentos', 'pdf');
        }

        try {
            DB::transaction(function () use ($idEditor, $id, $documento, $ruta): void {
                $anterior = $this->documentos->actualizar($idEditor, $id, $documento, $ruta);

                if ($ruta !== null) {
                    $this->archivos->eliminarSiHuerfano($anterior);
                }
            });
        } catch (Throwable $error) {
            $this->archivos->descartar($ruta);

            throw $error;
        }
    }

    /**
     * Reenvía a revisión un documento `no_publicado` y avisa a los revisores.
     *
     * @throws ExcepcionDominio
     */
    public function reenviar(int $idEditor, int $id): void
    {
        $actual = $this->documentos->obtener($id);
        $this->maquina->siguiente(EntidadRevisable::Documento, (string) $actual['estado'], null, AccionRevision::Reenviar);

        $this->documentos->reenviar($idEditor, $id);

        $this->notificador->enviadoARevision(EntidadRevisable::Documento, $id, $this->tituloFila($actual), idExcluido: $idEditor);
    }

    /**
     * Decisión del revisor con la máquina de estados común (la ruta HTTP es de la bandeja de revisión).
     * Al aprobar, la versión anterior pasa a `historico`; observar o descartar deja `no_publicado`.
     *
     * @return string Estado nuevo.
     *
     * @throws ExcepcionDominio
     */
    public function decidir(int $idRevisor, int $id, TipoDecision $tipo, ?string $observaciones = null): string
    {
        $actual = $this->documentos->obtener($id);

        $decision = new DecisionRevision($tipo, $idRevisor, (int) $actual['id_editor'], $observaciones);
        $this->maquina->siguiente(EntidadRevisable::Documento, (string) $actual['estado'], null, $tipo->accion());

        $estado = $this->documentos->decidir($idRevisor, $id, $tipo->value, $decision->observaciones);

        $this->notificador->decisionTomada(EntidadRevisable::Documento, $id, $this->tituloFila($actual), (int) $actual['id_editor'], $tipo, $decision->observaciones);

        return $estado;
    }

    /**
     * Documentos públicos: vigentes y, con `$historicos`, también los históricos.
     *
     * @return list<array<string, mixed>>
     */
    public function publicos(?string $tipo, bool $historicos): array
    {
        return array_map(
            fn (array $fila): array => [
                'id_documento' => (int) $fila['id_documento'],
                'tipo' => $fila['tipo'],
                'numero' => $fila['numero'],
                'titulo' => $fila['titulo'],
                'fecha_emision' => $fila['fecha_emision'],
                'fecha_vigencia' => $fila['fecha_vigencia'],
                'departamento' => $fila['departamento'],
                'estado' => $fila['estado'],
                'archivo_url' => $this->archivos->url($fila['archivo_pdf']),
            ],
            $this->publicos->listar($tipo, $historicos),
        );
    }

    /**
     * Tarea `portal:vencer-documentos`: pasa a `vencido` los vigentes expirados y avisa al área emisora.
     *
     * @return int Cantidad de documentos vencidos.
     */
    public function vencerExpirados(): int
    {
        $vencidos = $this->documentos->vencerExpirados();

        foreach ($vencidos as $documento) {
            $this->avisos->documentoVencido($documento);
        }

        return count($vencidos);
    }

    /**
     * Tarea `portal:avisar-vencimientos`: aviso previo, una sola vez (los que vencen en `$dias` días exactos).
     *
     * @return int Cantidad de avisos emitidos.
     */
    public function avisarPorVencer(?int $dias = null): int
    {
        $dias ??= (int) config('portal.dias_aviso_vencimiento', 15);
        $porVencer = $this->documentos->porVencer($dias);

        foreach ($porVencer as $documento) {
            $this->avisos->documentoPorVencer($documento, $dias);
        }

        return count($porVencer);
    }

    /**
     * @param  array<string, mixed>  $datos
     */
    private function armar(array $datos): DocumentoOficial
    {
        $tipo = TipoDocumento::tryFrom((string) ($datos['tipo'] ?? ''));

        if ($tipo === null) {
            throw new ReglaNegocioException('El tipo debe ser resolución, guía o política.', 'tipo');
        }

        return DocumentoOficial::crear(
            $tipo,
            (string) ($datos['numero'] ?? ''),
            (string) ($datos['titulo'] ?? ''),
            new DateTimeImmutable((string) $datos['fecha_emision']),
            (int) $datos['id_departamento_emisor'],
            new DateTimeImmutable((string) $datos['fecha_vigencia']),
        );
    }

    private function validarVersionAnterior(DocumentoOficial $documento, int $idAnterior): void
    {
        $anterior = $this->documentos->obtener($idAnterior);

        $documento->validarVersionAnterior(
            TipoDocumento::from((string) $anterior['tipo']),
            EstadoDocumento::from((string) $anterior['estado']),
            $this->documentos->tieneReemplazo($idAnterior),
        );
    }

    /**
     * @param  array<string, mixed>  $fila
     * @return array<string, mixed>
     */
    private function presentar(array $fila): array
    {
        $fila['archivo_url'] = $this->archivos->url($fila['archivo_pdf'] ?? null);
        unset($fila['archivo_pdf']);

        return $fila;
    }

    private function titulo(DocumentoOficial $documento): string
    {
        return "{$documento->tipo->value} {$documento->numero}";
    }

    /**
     * @param  array<string, mixed>  $fila
     */
    private function tituloFila(array $fila): string
    {
        return "{$fila['tipo']} {$fila['numero']}";
    }
}
