<?php

namespace App\Dominio\Revision;

use App\Dominio\Compartido\Excepciones\TransicionInvalidaException;
use App\Dominio\Revision\Politicas\PoliticaPlanEstudios;

/**
 * Máquina de estados de revisión: única fuente PHP de la tabla 2.2, espejada en `sp_rev_transicion`.
 *
 * Los servicios la consultan antes de llamar a la función PL/pgSQL para responder 409 con un mensaje claro.
 * Es pura (sin estado ni dependencias) y se puede instanciar con `new` o inyectar.
 */
final class MaquinaEstadosRevision
{
    /**
     * Fila de la tabla que corresponde a la combinación indicada.
     *
     * @param  string|null  $estado  Estado actual; `null` = registro nuevo.
     *
     * @throws TransicionInvalidaException
     */
    public function transicion(
        EntidadRevisable $entidad,
        ?string $estado,
        ?OperacionPendiente $operacion,
        AccionRevision $accion,
    ): Transicion {
        foreach ($entidad->politica()->transiciones() as $transicion) {
            if ($transicion->aplicaA($estado, $operacion, $accion)) {
                return $transicion;
            }
        }

        throw new TransicionInvalidaException(self::mensajeInvalida($estado, $operacion));
    }

    /**
     * Estado al que se llega.
     *
     * @param  bool  $comoVigente  Solo para plan + aprobar: `false` publica el plan como `historico` (consultable).
     *
     * @throws TransicionInvalidaException
     */
    public function siguiente(
        EntidadRevisable $entidad,
        ?string $estado,
        ?OperacionPendiente $operacion,
        AccionRevision $accion,
        bool $comoVigente = true,
    ): string {
        $hacia = $this->transicion($entidad, $estado, $operacion, $accion)->hacia;

        if ($entidad === EntidadRevisable::Plan && $accion === AccionRevision::Aprobar && ! $comoVigente) {
            return PoliticaPlanEstudios::ESTADO_APROBADO_CONSULTABLE;
        }

        return $hacia;
    }

    /** Indica si la combinación existe en la tabla. */
    public function permite(
        EntidadRevisable $entidad,
        ?string $estado,
        ?OperacionPendiente $operacion,
        AccionRevision $accion,
    ): bool {
        foreach ($entidad->politica()->transiciones() as $transicion) {
            if ($transicion->aplicaA($estado, $operacion, $accion)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Acciones disponibles desde un estado (útil para que el panel habilite botones).
     *
     * @return list<AccionRevision>
     */
    public function accionesPermitidas(EntidadRevisable $entidad, ?string $estado, ?OperacionPendiente $operacion): array
    {
        $acciones = [];

        foreach ($entidad->politica()->transiciones() as $transicion) {
            if ($transicion->desde === $estado && $transicion->operacion === $operacion && ! in_array($transicion->accion, $acciones, true)) {
                $acciones[] = $transicion->accion;
            }
        }

        return $acciones;
    }

    /** Mismo texto que `sp_rev_transicion` (RN409). */
    public static function mensajeInvalida(?string $estado, ?OperacionPendiente $operacion): string
    {
        $descripcion = $estado ?? 'nuevo';

        if ($operacion !== null) {
            $descripcion .= ' ('.$operacion->value.' pendiente)';
        }

        return 'Acción no permitida en estado '.$descripcion.'.';
    }
}
