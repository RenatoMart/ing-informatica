<?php

namespace App\Aplicacion\DocumentosAdmision;

use App\Aplicacion\Compartido\EstadoEnlace;
use App\Aplicacion\Compartido\NotificadorRevision;
use App\Aplicacion\Compartido\VerificadorEnlaces;
use App\Dominio\Compartido\Excepciones\ExcepcionDominio;
use App\Dominio\Compartido\Excepciones\NoEncontradoException;
use App\Dominio\Compartido\Excepciones\ReglaNegocioException;
use App\Dominio\DocumentosAdmision\CampanaAdmision;
use App\Dominio\DocumentosAdmision\EstadoCampana;
use App\Dominio\DocumentosAdmision\HitoCronograma;
use App\Dominio\DocumentosAdmision\ModalidadAdmision;
use App\Dominio\Revision\AccionRevision;
use App\Dominio\Revision\DecisionRevision;
use App\Dominio\Revision\EntidadRevisable;
use App\Dominio\Revision\MaquinaEstadosRevision;
use App\Dominio\Revision\TipoDecision;
use App\Persistencia\DocumentosAdmision\AdmisionPublicaRepositorio;
use App\Persistencia\DocumentosAdmision\CampanaRepositorio;
use DateTimeImmutable;

/**
 * Campañas de admisión (HU5, P8): CRUD de campaña, modalidades e hitos, validación y verificación
 * de enlaces antes de enviar a revisión, decisión, duplicado, cierre de vencidas y lectura pública.
 */
class AdmisionServicio
{
    public function __construct(
        private readonly CampanaRepositorio $campanas,
        private readonly AdmisionPublicaRepositorio $vistaPublica,
        private readonly VerificadorEnlaces $verificador,
        private readonly NotificadorRevision $notificador,
        private readonly AvisosDocumentosAdmision $avisos,
        private readonly MaquinaEstadosRevision $maquina,
    ) {}

    /**
     * @return list<array<string, mixed>>
     */
    public function listar(): array
    {
        return $this->campanas->listar();
    }

    /**
     * Campaña con `modalidades[]` y `cronograma[]`.
     *
     * @return array<string, mixed>
     */
    public function detalle(int $id): array
    {
        $campana = $this->campanas->obtener($id);
        unset($campana['id_editor'], $campana['id_director_revisa']);
        $campana['modalidades'] = $this->campanas->modalidades($id);
        $campana['cronograma'] = $this->campanas->cronograma($id);

        return $campana;
    }

    /**
     * @param  array<string, mixed>  $datos  `anio, proceso, fecha_inicio, fecha_fin, url_portal, url_estadisticas`
     * @return int `id_campana`
     *
     * @throws ExcepcionDominio
     */
    public function crear(int $idEditor, array $datos): int
    {
        return $this->campanas->crear($idEditor, $this->cabecera($datos));
    }

    /**
     * @param  array<string, mixed>  $datos
     *
     * @throws ExcepcionDominio
     */
    public function actualizar(int $idEditor, int $id, array $datos): void
    {
        $this->exigirBorrador($id, AccionRevision::Guardar);
        $this->campanas->actualizar($idEditor, $id, $this->cabecera($datos));
    }

    /**
     * Crea un borrador con la misma cabecera, modalidades e hitos (para corregir la vigente o preparar la siguiente).
     *
     * @return int `id_campana` del borrador nuevo.
     */
    public function duplicar(int $idEditor, int $id): int
    {
        return $this->campanas->duplicar($idEditor, $id);
    }

    /**
     * @param  array<string, mixed>  $datos  `nombre, dirigido_a, vacantes, descripcion`
     * @return int `id_modalidad`
     *
     * @throws ExcepcionDominio
     */
    public function agregarModalidad(int $idEditor, int $idCampana, array $datos): int
    {
        $this->exigirBorrador($idCampana, AccionRevision::Guardar);

        return $this->campanas->guardarModalidad($idEditor, $idCampana, null, $this->modalidad($datos));
    }

    /**
     * @param  array<string, mixed>  $datos
     *
     * @throws ExcepcionDominio
     */
    public function actualizarModalidad(int $idEditor, int $idModalidad, array $datos): void
    {
        $idCampana = $this->campanas->idCampanaDeModalidad($idModalidad);
        $this->exigirBorrador($idCampana, AccionRevision::Guardar);

        $this->campanas->guardarModalidad($idEditor, $idCampana, $idModalidad, $this->modalidad($datos));
    }

    public function eliminarModalidad(int $idEditor, int $idModalidad): void
    {
        $this->exigirBorrador($this->campanas->idCampanaDeModalidad($idModalidad), AccionRevision::Guardar);
        $this->campanas->eliminarModalidad($idEditor, $idModalidad);
    }

    /**
     * @param  array<string, mixed>  $datos  `hito, fecha`
     * @return int `id_hito`
     *
     * @throws ExcepcionDominio
     */
    public function agregarHito(int $idEditor, int $idCampana, array $datos): int
    {
        $campana = $this->exigirBorrador($idCampana, AccionRevision::Guardar);

        return $this->campanas->guardarHito($idEditor, $idCampana, null, $this->hito($datos, $campana));
    }

    /**
     * @param  array<string, mixed>  $datos
     *
     * @throws ExcepcionDominio
     */
    public function actualizarHito(int $idEditor, int $idHito, array $datos): void
    {
        $idCampana = $this->campanas->idCampanaDeHito($idHito);
        $campana = $this->exigirBorrador($idCampana, AccionRevision::Guardar);

        $this->campanas->guardarHito($idEditor, $idCampana, $idHito, $this->hito($datos, $campana));
    }

    public function eliminarHito(int $idEditor, int $idHito): void
    {
        $this->exigirBorrador($this->campanas->idCampanaDeHito($idHito), AccionRevision::Guardar);
        $this->campanas->eliminarHito($idEditor, $idHito);
    }

    /**
     * Errores y avisos de `sp_campana_validar`.
     *
     * @return list<array{nivel: string, codigo: string, mensaje: string}>
     */
    public function validacion(int $id): array
    {
        $this->campanas->obtener($id);

        return $this->campanas->validar($id);
    }

    /**
     * Comprueba los dos enlaces de la campaña: `{url_portal: {ok, estado_http}, url_estadisticas: {...}}`.
     *
     * @return array<string, array{ok: bool, estado_http: int|null}>
     */
    public function verificarEnlaces(int $id): array
    {
        $campana = $this->campanas->obtener($id);

        return array_map(
            static fn (EstadoEnlace $estado): array => $estado->aArreglo(),
            $this->verificador->verificarVarios([
                'url_portal' => $campana['url_portal'],
                'url_estadisticas' => $campana['url_estadisticas'],
            ]),
        );
    }

    /**
     * Valida la campaña, verifica los enlaces con {@see VerificadorEnlaces} y la envía a revisión.
     *
     * @throws ExcepcionDominio
     */
    public function enviarRevision(int $idEditor, int $id): void
    {
        $campana = $this->campanas->obtener($id);
        $this->maquina->siguiente(EntidadRevisable::Campana, (string) $campana['estado'], null, AccionRevision::EnviarRevision);

        $errores = array_filter($this->campanas->validar($id), static fn (array $item): bool => $item['nivel'] === 'error');

        if ($errores !== []) {
            throw new ReglaNegocioException(implode('; ', array_column($errores, 'mensaje')), 'campana');
        }

        $enlaces = $this->verificarEnlaces($id);
        $verificados = ! in_array(false, array_column($enlaces, 'ok'), true);

        $this->campanas->enviarRevision($idEditor, $id, $verificados);

        $this->notificador->enviadoARevision(EntidadRevisable::Campana, $id, $this->titulo($campana), idExcluido: $idEditor);
    }

    /**
     * Decisión del revisor con la máquina de estados común. Al aprobar, la vigente y la cerrada
     * pasan a `archivada`; `descartar` no está permitido en campañas (409).
     *
     * @return string Estado nuevo.
     *
     * @throws ExcepcionDominio
     */
    public function decidir(int $idRevisor, int $id, TipoDecision $tipo, ?string $observaciones = null): string
    {
        $campana = $this->campanas->obtener($id);

        $decision = new DecisionRevision($tipo, $idRevisor, (int) $campana['id_editor'], $observaciones);
        $this->maquina->siguiente(EntidadRevisable::Campana, (string) $campana['estado'], null, $tipo->accion());

        $estado = $this->campanas->decidir($idRevisor, $id, $tipo->value, $decision->observaciones);

        $this->notificador->decisionTomada(EntidadRevisable::Campana, $id, $this->titulo($campana), (int) $campana['id_editor'], $tipo, $decision->observaciones);

        return $estado;
    }

    /**
     * Tarea `portal:cerrar-campanas`: cierra la vigente cuya `fecha_fin` pasó y avisa a la Comisión.
     *
     * @return int Cantidad de campañas cerradas.
     */
    public function cerrarVencidas(): int
    {
        $cerradas = $this->campanas->cerrarVencidas();

        foreach ($cerradas as $campana) {
            $this->avisos->campanaCerrada($campana);
        }

        return count($cerradas);
    }

    /**
     * Campaña vigente para el sitio público.
     *
     * @return array{campana: array<string, mixed>, modalidades: list<array<string, mixed>>, cronograma: list<array<string, mixed>>}
     *
     * @throws NoEncontradoException `SIN_CAMPANA_VIGENTE`
     */
    public function publica(): array
    {
        $vigente = $this->vistaPublica->campanaVigente();

        if ($vigente === null) {
            throw new NoEncontradoException('No hay una campaña de admisión vigente.', null, 'SIN_CAMPANA_VIGENTE');
        }

        $vigente['modalidades'] = array_map(static fn (array $m): array => [
            'id_modalidad' => $m['id_modalidad'],
            'nombre' => $m['nombre'],
            'dirigido_a' => $m['dirigido_a'],
            'vacantes' => $m['vacantes'],
            'descripcion' => $m['descripcion'],
        ], $vigente['modalidades']);

        $vigente['cronograma'] = array_map(static fn (array $h): array => [
            'hito' => $h['hito'],
            'fecha' => $h['fecha'],
        ], $vigente['cronograma']);

        return $vigente;
    }

    /**
     * Exige que la campaña esté en `borrador` (409 en otro estado) y la devuelve.
     *
     * @return array<string, mixed>
     */
    private function exigirBorrador(int $idCampana, AccionRevision $accion): array
    {
        $campana = $this->campanas->obtener($idCampana);

        if (! EstadoCampana::from((string) $campana['estado'])->esEditable()) {
            $this->maquina->siguiente(EntidadRevisable::Campana, (string) $campana['estado'], null, $accion);
        }

        return $campana;
    }

    /**
     * @param  array<string, mixed>  $datos
     */
    private function cabecera(array $datos): CampanaAdmision
    {
        return CampanaAdmision::crear(
            (int) ($datos['anio'] ?? 0),
            isset($datos['proceso']) ? (string) $datos['proceso'] : null,
            $this->fecha($datos['fecha_inicio'] ?? null),
            $this->fecha($datos['fecha_fin'] ?? null),
            isset($datos['url_portal']) ? (string) $datos['url_portal'] : null,
            isset($datos['url_estadisticas']) ? (string) $datos['url_estadisticas'] : null,
        );
    }

    /**
     * @param  array<string, mixed>  $datos
     */
    private function modalidad(array $datos): ModalidadAdmision
    {
        return ModalidadAdmision::crear(
            (string) ($datos['nombre'] ?? ''),
            isset($datos['dirigido_a']) ? (string) $datos['dirigido_a'] : null,
            (int) ($datos['vacantes'] ?? 0),
            isset($datos['descripcion']) ? (string) $datos['descripcion'] : null,
        );
    }

    /**
     * @param  array<string, mixed>  $datos
     * @param  array<string, mixed>  $campana
     */
    private function hito(array $datos, array $campana): HitoCronograma
    {
        return HitoCronograma::crear(
            (string) ($datos['hito'] ?? ''),
            new DateTimeImmutable((string) $datos['fecha']),
            $this->fecha($campana['fecha_inicio']),
            $this->fecha($campana['fecha_fin']),
        );
    }

    private function fecha(mixed $valor): ?DateTimeImmutable
    {
        return $valor === null || $valor === '' ? null : new DateTimeImmutable((string) $valor);
    }

    /**
     * @param  array<string, mixed>  $campana
     */
    private function titulo(array $campana): string
    {
        return $campana['proceso'] === null ? "Admisión {$campana['anio']}" : "Admisión {$campana['anio']}-{$campana['proceso']}";
    }
}
