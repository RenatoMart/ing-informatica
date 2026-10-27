<?php

namespace App\Persistencia\DocumentosAdmision;

use App\Dominio\Compartido\Excepciones\NoEncontradoException;
use App\Dominio\DocumentosAdmision\CampanaAdmision;
use App\Dominio\DocumentosAdmision\HitoCronograma;
use App\Dominio\DocumentosAdmision\ModalidadAdmision;
use App\Persistencia\Compartido\Repositorio;

/**
 * Campañas de admisión del panel (con modalidades e hitos): lecturas con Query Builder y
 * escrituras solo vía `sp_campana_*`, `sp_modalidad_*` y `sp_hito_*`.
 */
class CampanaRepositorio extends Repositorio
{
    /**
     * @return list<array<string, mixed>>
     */
    public function listar(): array
    {
        return $this->todas(
            $this->tabla('campana_admision')
                ->select('id_campana', 'anio', 'proceso', 'estado', 'fecha_inicio', 'fecha_fin')
                ->orderByDesc('anio')
                ->orderByDesc('id_campana'),
        );
    }

    /**
     * Cabecera de la campaña (sin modalidades ni hitos).
     *
     * @return array<string, mixed>
     *
     * @throws NoEncontradoException
     */
    public function obtener(int $id): array
    {
        return $this->primeraOFallar(
            $this->tabla('campana_admision')->where('id_campana', $id),
            'Campaña no encontrada.',
        );
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function modalidades(int $idCampana): array
    {
        return $this->todas(
            $this->tabla('modalidad_admision')->where('id_campana', $idCampana)->orderBy('id_modalidad'),
        );
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function cronograma(int $idCampana): array
    {
        return $this->todas(
            $this->tabla('cronograma_admision')->where('id_campana', $idCampana)->orderBy('fecha')->orderBy('id_hito'),
        );
    }

    /**
     * @throws NoEncontradoException
     */
    public function idCampanaDeModalidad(int $idModalidad): int
    {
        $fila = $this->primeraOFallar(
            $this->tabla('modalidad_admision')->where('id_modalidad', $idModalidad)->select('id_campana'),
            'Modalidad no encontrada.',
        );

        return (int) $fila['id_campana'];
    }

    /**
     * @throws NoEncontradoException
     */
    public function idCampanaDeHito(int $idHito): int
    {
        $fila = $this->primeraOFallar(
            $this->tabla('cronograma_admision')->where('id_hito', $idHito)->select('id_campana'),
            'Hito no encontrado.',
        );

        return (int) $fila['id_campana'];
    }

    public function crear(int $idEditor, CampanaAdmision $campana): int
    {
        return (int) $this->sp->escalar('sp_campana_crear', [$idEditor, ...$this->cabecera($campana)]);
    }

    public function actualizar(int $idEditor, int $id, CampanaAdmision $campana): void
    {
        $this->sp->ejecutar('sp_campana_actualizar', [$idEditor, $id, ...$this->cabecera($campana)]);
    }

    public function duplicar(int $idEditor, int $idOrigen): int
    {
        return (int) $this->sp->escalar('sp_campana_duplicar', [$idEditor, $idOrigen]);
    }

    public function guardarModalidad(int $idEditor, int $idCampana, ?int $idModalidad, ModalidadAdmision $modalidad): int
    {
        return (int) $this->sp->escalar('sp_modalidad_guardar', [
            $idEditor, $idCampana, $idModalidad, $modalidad->nombre, $modalidad->dirigidoA,
            $modalidad->vacantes, $modalidad->descripcion,
        ]);
    }

    public function eliminarModalidad(int $idEditor, int $idModalidad): void
    {
        $this->sp->ejecutar('sp_modalidad_eliminar', [$idEditor, $idModalidad]);
    }

    public function guardarHito(int $idEditor, int $idCampana, ?int $idHito, HitoCronograma $hito): int
    {
        return (int) $this->sp->escalar('sp_hito_guardar', [
            $idEditor, $idCampana, $idHito, $hito->hito, $hito->fecha->format('Y-m-d'),
        ]);
    }

    public function eliminarHito(int $idEditor, int $idHito): void
    {
        $this->sp->ejecutar('sp_hito_eliminar', [$idEditor, $idHito]);
    }

    /**
     * @return list<array{nivel: string, codigo: string, mensaje: string}>
     */
    public function validar(int $id): array
    {
        /** @var list<array{nivel: string, codigo: string, mensaje: string}> */
        return $this->sp->filas('sp_campana_validar', [$id]);
    }

    public function enviarRevision(int $idEditor, int $id, bool $enlacesVerificados): void
    {
        $this->sp->ejecutar('sp_campana_enviar_revision', [$idEditor, $id, $enlacesVerificados]);
    }

    /**
     * @return string Estado nuevo.
     */
    public function decidir(int $idRevisor, int $id, string $decision, ?string $observaciones): string
    {
        return (string) $this->sp->escalar('sp_campana_decidir', [$idRevisor, $id, $decision, $observaciones]);
    }

    /**
     * @return list<array<string, mixed>> Campañas que pasaron a `cerrada`.
     */
    public function cerrarVencidas(): array
    {
        return $this->sp->filas('sp_campana_cerrar_vencidas');
    }

    /**
     * @return list<mixed>
     */
    private function cabecera(CampanaAdmision $campana): array
    {
        return [
            $campana->anio,
            $campana->proceso,
            $campana->fechaInicio?->format('Y-m-d'),
            $campana->fechaFin?->format('Y-m-d'),
            $campana->urlPortal?->valor,
            $campana->urlEstadisticas?->valor,
        ];
    }
}
