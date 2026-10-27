<?php

namespace App\Dominio\Usuarios;

use App\Dominio\Compartido\Excepciones\ReglaNegocioException;
use App\Dominio\Compartido\Excepciones\TransicionInvalidaException;

/**
 * Solicitud de acceso (P5): alta, cambio de rol o baja. Reglas por tipo:
 * el alta exige correo; el cambio de rol y la baja exigen usuario objetivo; el cambio de rol exige rol.
 * Solo se resuelve si está pendiente y solo se ejecuta si está autorizada y no ejecutada.
 */
final readonly class SolicitudAcceso
{
    public function __construct(
        public ?int $idSolicitud,
        public string $solicitanteNombre,
        public TipoSolicitud $tipo,
        public ?int $idRolSolicitado,
        public ?string $motivo,
        public EstadoSolicitud $estado,
        public ?string $correoSolicitado,
        public ?int $idUsuarioObjetivo,
        public bool $ejecutada = false,
    ) {}

    /**
     * Valida y construye una solicitud nueva (estado `pendiente`).
     *
     * @throws ReglaNegocioException
     */
    public static function nueva(
        string $solicitanteNombre,
        TipoSolicitud $tipo,
        ?int $idRolSolicitado,
        ?string $motivo,
        ?CorreoInstitucional $correo,
        ?int $idUsuarioObjetivo,
    ): self {
        $solicitanteNombre = trim($solicitanteNombre);

        if ($solicitanteNombre === '' || mb_strlen($solicitanteNombre) > 150) {
            throw new ReglaNegocioException('El nombre del solicitante es obligatorio (máximo 150 caracteres).', 'solicitante_nombre');
        }

        if ($motivo !== null && mb_strlen($motivo) > 255) {
            throw new ReglaNegocioException('El motivo no puede superar 255 caracteres.', 'motivo');
        }

        if ($tipo === TipoSolicitud::Alta) {
            if ($correo === null) {
                throw new ReglaNegocioException('El correo es obligatorio para un alta.', 'correo_solicitado');
            }

            if ($idRolSolicitado === null) {
                throw new ReglaNegocioException('El rol solicitado es obligatorio para un alta.', 'id_rol_solicitado');
            }

            $idUsuarioObjetivo = null;
        } else {
            if ($idUsuarioObjetivo === null) {
                throw new ReglaNegocioException('Debe indicar el usuario objetivo.', 'id_usuario_objetivo');
            }

            if ($tipo === TipoSolicitud::CambioRol && $idRolSolicitado === null) {
                throw new ReglaNegocioException('El rol solicitado es obligatorio para un cambio de rol.', 'id_rol_solicitado');
            }

            $correo = null;
        }

        return new self(
            null,
            $solicitanteNombre,
            $tipo,
            $idRolSolicitado,
            $motivo === null || trim($motivo) === '' ? null : trim($motivo),
            EstadoSolicitud::Pendiente,
            $correo?->valor,
            $idUsuarioObjetivo,
        );
    }

    /**
     * @throws TransicionInvalidaException
     */
    public function verificarResoluble(): void
    {
        if ($this->estado !== EstadoSolicitud::Pendiente) {
            throw new TransicionInvalidaException('La solicitud ya fue resuelta.', 'estado');
        }
    }

    /**
     * Comprueba que la solicitud sea del tipo esperado, esté autorizada, no ejecutada y,
     * si se indica, que apunte al usuario de la ruta.
     *
     * @throws TransicionInvalidaException
     */
    public function verificarEjecutable(TipoSolicitud $tipo, ?int $idUsuarioRuta = null): void
    {
        if ($this->tipo !== $tipo) {
            throw new TransicionInvalidaException("La solicitud #{$this->idSolicitud} no es de {$tipo->etiqueta()}.", 'id_solicitud');
        }

        if ($this->estado !== EstadoSolicitud::Autorizada) {
            throw new TransicionInvalidaException("La solicitud #{$this->idSolicitud} no está autorizada.", 'id_solicitud');
        }

        if ($this->ejecutada) {
            throw new TransicionInvalidaException("La solicitud #{$this->idSolicitud} ya fue ejecutada.", 'id_solicitud');
        }

        if ($idUsuarioRuta !== null && $this->idUsuarioObjetivo !== $idUsuarioRuta) {
            throw new TransicionInvalidaException("La solicitud #{$this->idSolicitud} corresponde a otro usuario.", 'id_solicitud');
        }
    }
}
