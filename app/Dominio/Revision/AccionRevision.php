<?php

namespace App\Dominio\Revision;

/**
 * Acciones de la tabla de transiciones (sección 2.2). El valor es el literal que usa
 * `sp_rev_transicion` y el que se guarda en `historial_revision.accion`.
 *
 * `ReemplazarVigente` es el efecto que sufre la versión anterior cuando se aprueba una nueva
 * (plan: vigente → historico; documento: vigente/vencido → historico; campaña: vigente/cerrada → archivada).
 */
enum AccionRevision: string
{
    case Guardar = 'guardar';
    case EnviarRevision = 'enviar_revision';
    case Aprobar = 'aprobar';
    case Observar = 'observar';
    case Descartar = 'descartar';
    case ProponerCambio = 'proponer_cambio';
    case SolicitarBaja = 'solicitar_baja';
    case Reactivar = 'reactivar';
    case Reenviar = 'reenviar';
    case Vencer = 'vencer';
    case Cerrar = 'cerrar';
    case ReemplazarVigente = 'reemplazar_vigente';

    /** Indica si la acción es una decisión del revisor. */
    public function esDecision(): bool
    {
        return $this === self::Aprobar || $this === self::Observar || $this === self::Descartar;
    }
}
