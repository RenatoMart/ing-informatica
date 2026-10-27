<?php

namespace App\Dominio\Revision;

/**
 * Una fila de la tabla de transiciones (sección 2.2).
 */
final readonly class Transicion
{
    /**
     * @param  string|null  $desde  Estado de origen; `null` = registro nuevo.
     * @param  OperacionPendiente|null  $operacion  Operación pendiente de origen; `null` = "—".
     * @param  OperacionPendiente|null  $operacionResultante  Operación pendiente tras la transición.
     */
    public function __construct(
        public ?string $desde,
        public ?OperacionPendiente $operacion,
        public AccionRevision $accion,
        public string $hacia,
        public ?OperacionPendiente $operacionResultante,
        public ActorRevision $actor,
    ) {}

    public function aplicaA(?string $estado, ?OperacionPendiente $operacion, AccionRevision $accion): bool
    {
        return $this->desde === $estado && $this->operacion === $operacion && $this->accion === $accion;
    }
}
