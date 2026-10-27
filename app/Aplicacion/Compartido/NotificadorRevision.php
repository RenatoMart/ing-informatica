<?php

namespace App\Aplicacion\Compartido;

use App\Aplicacion\Compartido\Correos\ContenidoEnRevisionMail;
use App\Aplicacion\Compartido\Correos\DecisionRevisionMail;
use App\Dominio\Revision\EntidadRevisable;
use App\Dominio\Revision\TipoDecision;
use App\Persistencia\Compartido\DestinatariosRepositorio;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

/**
 * Avisa por correo a los revisores activos cuando algo entra en revisión y al editor cuando hay decisión.
 * Un fallo de envío solo se registra en el log: nunca rompe la operación de negocio.
 */
class NotificadorRevision
{
    public function __construct(private readonly DestinatariosRepositorio $destinatarios) {}

    /**
     * @param  string  $operacion  `revision`, `cambio` o `baja` (como `v_rev_pendientes.operacion`).
     */
    public function enviadoARevision(EntidadRevisable $entidad, int $idRegistro, string $titulo, string $operacion = 'revision', ?int $idExcluido = null): void
    {
        $this->sinRomper(function () use ($entidad, $idRegistro, $titulo, $operacion, $idExcluido): void {
            $correos = $this->destinatarios->correosActivosPorRol('Revisor');

            if ($idExcluido !== null) {
                $excluido = $this->destinatarios->correoUsuarioActivo($idExcluido);
                $correos = array_values(array_filter($correos, static fn (string $correo): bool => $correo !== $excluido));
            }

            foreach ($correos as $correo) {
                Mail::to($correo)->send(new ContenidoEnRevisionMail($entidad, $idRegistro, $titulo, $operacion));
            }
        });
    }

    public function decisionTomada(EntidadRevisable $entidad, int $idRegistro, string $titulo, int $idEditor, TipoDecision $decision, ?string $observaciones = null): void
    {
        $this->sinRomper(function () use ($entidad, $idRegistro, $titulo, $idEditor, $decision, $observaciones): void {
            $correo = $this->destinatarios->correoUsuarioActivo($idEditor);

            if ($correo !== null) {
                Mail::to($correo)->send(new DecisionRevisionMail($entidad, $idRegistro, $titulo, $decision, $observaciones));
            }
        });
    }

    /**
     * @param  callable(): void  $envio
     */
    private function sinRomper(callable $envio): void
    {
        try {
            $envio();
        } catch (Throwable $error) {
            Log::warning('No se pudo enviar la notificación de revisión.', ['error' => $error->getMessage()]);
        }
    }
}
