<?php

namespace App\Dominio\Revision;

use App\Dominio\Compartido\Excepciones\AccesoDenegadoException;
use App\Dominio\Compartido\Excepciones\ReglaNegocioException;
use DateTimeImmutable;

/**
 * Decisión del revisor (objeto de valor). Replica `sp_rev_validar_decision`:
 * el revisor no puede ser el editor ni el editor del cambio pendiente (403), y observar o descartar
 * exige observaciones de 5 a 500 caracteres (422, campo `observaciones`).
 */
final readonly class DecisionRevision
{
    public const OBSERVACIONES_MIN = 5;

    public const OBSERVACIONES_MAX = 500;

    public ?string $observaciones;

    /**
     * @param  int|null  $idEditorCambio  Autor del cambio o de la baja pendiente (`cambios_pendientes->>'_id_editor'`).
     *
     * @throws AccesoDenegadoException
     * @throws ReglaNegocioException
     */
    public function __construct(
        public TipoDecision $tipo,
        public int $idRevisor,
        public int $idEditor,
        ?string $observaciones = null,
        public ?int $idEditorCambio = null,
        public DateTimeImmutable $fecha = new DateTimeImmutable,
    ) {
        if ($idRevisor === $idEditor || ($idEditorCambio !== null && $idRevisor === $idEditorCambio)) {
            throw new AccesoDenegadoException('No puede revisar contenido que usted editó.');
        }

        $observaciones = $observaciones === null ? null : trim($observaciones);
        $observaciones = $observaciones === '' ? null : $observaciones;

        if ($tipo->exigeObservaciones() && $observaciones === null) {
            throw new ReglaNegocioException('Las observaciones son obligatorias si no se aprueba.', 'observaciones');
        }

        if ($observaciones !== null) {
            $longitud = mb_strlen($observaciones);
            $minimo = $tipo->exigeObservaciones() ? self::OBSERVACIONES_MIN : 0;

            if ($longitud < $minimo || $longitud > self::OBSERVACIONES_MAX) {
                throw new ReglaNegocioException('Las observaciones deben tener entre 5 y 500 caracteres.', 'observaciones');
            }
        }

        $this->observaciones = $observaciones;
    }
}
