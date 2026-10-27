<?php

namespace App\Aplicacion\Docentes;

use App\Aplicacion\Compartido\AlmacenArchivos;
use App\Aplicacion\Compartido\NotificadorRevision;
use App\Aplicacion\Compartido\ProcesadorImagenes;
use App\Dominio\Compartido\Excepciones\NoEncontradoException;
use App\Dominio\Compartido\Excepciones\ReglaNegocioException;
use App\Dominio\Compartido\Paginacion;
use App\Dominio\Compartido\ResultadoPaginado;
use App\Dominio\Docentes\Docente;
use App\Dominio\Docentes\Encuadre;
use App\Dominio\Docentes\EstadoDocente;
use App\Dominio\Docentes\FotoDocente;
use App\Dominio\Revision\AccionRevision;
use App\Dominio\Revision\DecisionRevision;
use App\Dominio\Revision\EntidadRevisable;
use App\Dominio\Revision\MaquinaEstadosRevision;
use App\Dominio\Revision\OperacionPendiente;
use App\Dominio\Revision\TipoDecision;
use App\Persistencia\Docentes\DocenteRepositorio;
use finfo;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Throwable;

/**
 * Casos de uso del panel de docentes (HU3, P3): alta, cambio, foto y encuadre, envío a revisión,
 * baja y reactivación (sin eliminar), y decisión del revisor. Un docente publicado se modifica
 * como cambio pendiente; el registro público no cambia hasta que se aprueba.
 */
class DocentesServicio
{
    public function __construct(
        private readonly DocenteRepositorio $repositorio,
        private readonly AlmacenArchivos $almacen,
        private readonly ProcesadorImagenes $imagenes,
        private readonly NotificadorRevision $notificador,
        private readonly MaquinaEstadosRevision $maquina = new MaquinaEstadosRevision,
    ) {}

    /**
     * @param  array{estado?: string|null, id_departamento?: int|string|null, q?: string|null}  $filtros
     * @return ResultadoPaginado<array<string, mixed>>
     */
    public function listar(array $filtros, Paginacion $paginacion): ResultadoPaginado
    {
        return $this->repositorio->listar($filtros, $paginacion)->mapear(function (array $fila): array {
            $fila['foto_url'] = $this->almacen->url($fila['ruta_fotografia']);
            unset($fila['ruta_fotografia']);

            return $fila;
        });
    }

    /**
     * @return array<string, mixed> Detalle con `especialidades`, `foto_url` y `cambios_pendientes`.
     *
     * @throws NoEncontradoException
     */
    public function detalle(int $id): array
    {
        $docente = $this->repositorio->obtener($id);
        $datos = $docente->aArreglo();

        $datos['foto_url'] = $this->almacen->url($docente->rutaFotografia);
        unset($datos['ruta_fotografia']);

        if (isset($datos['cambios_pendientes']['ruta_fotografia'])) {
            $datos['cambios_pendientes']['foto_url'] = $this->almacen->url((string) $datos['cambios_pendientes']['ruta_fotografia']);
            unset($datos['cambios_pendientes']['ruta_fotografia']);
        }

        return $datos;
    }

    /**
     * @param  array<string, mixed>  $datos  Ver {@see self::normalizar()}.
     * @return int `id_docente` (queda en borrador).
     *
     * @throws ReglaNegocioException
     */
    public function crear(int $idEditor, array $datos): int
    {
        $d = $this->normalizar($datos);

        return DB::transaction(fn (): int => $this->repositorio->crear(
            $idEditor, $d['nombres'], $d['apellidos'], $d['grado'], $d['id_departamento'], $d['curso'],
            $d['condicion'], $d['es_investigador'], $d['renacyt'], $d['especialidades'],
        ));
    }

    /**
     * @param  array<string, mixed>  $datos
     * @return string `directo` (borrador) o `cambio_pendiente` (publicado).
     *
     * @throws ReglaNegocioException
     */
    public function actualizar(int $idEditor, int $id, array $datos): string
    {
        $d = $this->normalizar($datos);

        $modo = DB::transaction(fn (): string => $this->repositorio->actualizar(
            $idEditor, $id, $d['nombres'], $d['apellidos'], $d['grado'], $d['id_departamento'], $d['curso'],
            $d['condicion'], $d['es_investigador'], $d['renacyt'], $d['especialidades'],
        ));

        if ($modo === 'cambio_pendiente') {
            $this->notificador->enviadoARevision(EntidadRevisable::Docente, $id, "{$d['nombres']} {$d['apellidos']}", 'cambio', $idEditor);
        }

        return $modo;
    }

    /**
     * Procesa la foto (WebP, máximo 900 px por el lado mayor), la guarda y la asigna con su encuadre
     * (si no se indica, se conserva el actual).
     * El archivo anterior que quede huérfano se borra después del commit.
     *
     * @return array{foto_url: string, pendiente: bool} `pendiente` si el docente ya está publicado.
     *
     * @throws ReglaNegocioException
     */
    public function establecerFoto(int $idEditor, int $id, UploadedFile $archivo, ?Encuadre $encuadre = null): array
    {
        $docente = $this->repositorio->obtener($id);
        $encuadre ??= $docente->encuadre;

        $this->maquina->transicion(
            EntidadRevisable::Docente, $docente->estado->value, $this->operacion($docente),
            $docente->estado === EstadoDocente::Borrador ? AccionRevision::Guardar : AccionRevision::ProponerCambio,
        );

        $this->validarFoto($archivo);
        $procesada = $this->imagenes->fotoDocente($archivo, 'foto');
        $ruta = $this->almacen->guardarContenido($procesada->contenido, 'docentes', $procesada->extension);

        try {
            DB::transaction(function () use ($idEditor, $id, $ruta, $encuadre): void {
                $this->almacen->eliminarSiHuerfano($this->repositorio->establecerFoto($idEditor, $id, $ruta, $encuadre));
            });
        } catch (Throwable $error) {
            $this->almacen->descartar($ruta);

            throw $error;
        }

        return ['foto_url' => (string) $this->almacen->url($ruta), 'pendiente' => $docente->estado !== EstadoDocente::Borrador];
    }

    public function establecerEncuadre(int $idEditor, int $id, Encuadre $encuadre): void
    {
        DB::transaction(fn () => $this->repositorio->establecerEncuadre($idEditor, $id, $encuadre));
    }

    public function enviarRevision(int $idEditor, int $id): void
    {
        $docente = $this->repositorio->obtener($id);

        $this->maquina->transicion(EntidadRevisable::Docente, $docente->estado->value, $this->operacion($docente), AccionRevision::EnviarRevision);
        $docente->validarParaEnviar();

        DB::transaction(fn () => $this->repositorio->enviarRevision($idEditor, $id));
        $this->notificador->enviadoARevision(EntidadRevisable::Docente, $id, $this->nombre($docente), 'revision', $idEditor);
    }

    public function solicitarBaja(int $idEditor, int $id): void
    {
        DB::transaction(fn () => $this->repositorio->solicitarBaja($idEditor, $id));
        $this->notificador->enviadoARevision(EntidadRevisable::Docente, $id, $this->nombre($this->repositorio->obtener($id)), 'baja', $idEditor);
    }

    public function reactivar(int $idEditor, int $id): void
    {
        DB::transaction(fn () => $this->repositorio->reactivar($idEditor, $id));
    }

    /**
     * Decisión del revisor validada con la máquina de estados común (el docente no admite `descartar`).
     *
     * @return string Estado resultante.
     */
    public function decidir(int $idRevisor, int $id, TipoDecision $tipo, ?string $observaciones = null): string
    {
        $docente = $this->repositorio->obtener($id);
        [$idEditor, $idEditorCambio] = $this->repositorio->idEditorYCambio($id);

        $this->maquina->transicion(EntidadRevisable::Docente, $docente->estado->value, $this->operacion($docente), $tipo->accion());
        $decision = new DecisionRevision($tipo, $idRevisor, $idEditor, $observaciones, $idEditorCambio);

        $estado = DB::transaction(fn (): string => $this->repositorio->decidir($idRevisor, $id, $tipo->value, $decision->observaciones));
        $this->notificador->decisionTomada(EntidadRevisable::Docente, $id, $this->nombre($docente), $idEditorCambio ?? $idEditor, $tipo, $decision->observaciones);

        return $estado;
    }

    /**
     * @param  array<string, mixed>  $datos
     * @return array{nombres: string, apellidos: string, grado: ?string, id_departamento: ?int, curso: ?string, condicion: ?string, es_investigador: bool, renacyt: ?string, especialidades: list<string>}
     *
     * @throws ReglaNegocioException
     */
    private function normalizar(array $datos): array
    {
        $esInvestigador = filter_var($datos['es_investigador'] ?? false, FILTER_VALIDATE_BOOLEAN);
        $renacyt = isset($datos['categoria_renacyt']) ? trim((string) $datos['categoria_renacyt']) : null;
        $condicion = isset($datos['condicion_laboral']) && $datos['condicion_laboral'] !== '' ? (string) $datos['condicion_laboral'] : null;

        $especialidades = Docente::validarCampos(
            (string) ($datos['nombres'] ?? ''), (string) ($datos['apellidos'] ?? ''), $condicion,
            $esInvestigador, $renacyt, array_map(strval(...), (array) ($datos['especialidades'] ?? [])),
        );

        return [
            'nombres' => trim((string) $datos['nombres']),
            'apellidos' => trim((string) $datos['apellidos']),
            'grado' => $datos['grado_academico'] ?? null,
            'id_departamento' => isset($datos['id_departamento']) ? (int) $datos['id_departamento'] : null,
            'curso' => $datos['curso_principal'] ?? null,
            'condicion' => $condicion,
            'es_investigador' => $esInvestigador,
            'renacyt' => $esInvestigador ? $renacyt : null,
            'especialidades' => $especialidades,
        ];
    }

    /**
     * Aplica las reglas de archivo de {@see FotoDocente} con el mime real y las dimensiones del archivo.
     *
     * @throws ReglaNegocioException
     */
    private function validarFoto(UploadedFile $archivo): void
    {
        $ruta = $archivo->getRealPath();
        $medidas = $ruta === false ? false : @getimagesize($ruta);

        if ($ruta === false || $medidas === false) {
            throw new ReglaNegocioException('La foto debe ser una imagen JPG, PNG o WebP válida.', 'foto');
        }

        new FotoDocente(
            (string) (new finfo(FILEINFO_MIME_TYPE))->file($ruta),
            (int) $archivo->getSize(),
            $medidas[0],
            $medidas[1],
        );
    }

    private function operacion(Docente $docente): ?OperacionPendiente
    {
        return $docente->operacionPendiente === null ? null : OperacionPendiente::from($docente->operacionPendiente);
    }

    private function nombre(Docente $docente): string
    {
        return "{$docente->nombres} {$docente->apellidos}";
    }
}
