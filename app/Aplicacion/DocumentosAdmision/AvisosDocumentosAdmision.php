<?php

namespace App\Aplicacion\DocumentosAdmision;

use App\Aplicacion\DocumentosAdmision\Correos\CampanaCerradaMail;
use App\Aplicacion\DocumentosAdmision\Correos\DocumentoPorVencerMail;
use App\Aplicacion\DocumentosAdmision\Correos\DocumentoVencidoMail;
use App\Persistencia\Compartido\DestinatariosRepositorio;
use Illuminate\Contracts\Mail\Mailable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

/**
 * Correos de las tareas programadas del módulo: vencimiento de documentos (al área emisora o,
 * si no tiene correo, a los revisores) y cierre de campañas (a la Comisión de Admisión).
 * Un fallo de envío solo se registra en el log: nunca revierte la tarea.
 */
class AvisosDocumentosAdmision
{
    public function __construct(private readonly DestinatariosRepositorio $destinatarios) {}

    /**
     * @param  array<string, mixed>  $documento  Fila de `sp_documento_vencer_expirados`.
     */
    public function documentoVencido(array $documento): void
    {
        $this->enviar(
            $this->correosArea($documento),
            new DocumentoVencidoMail((int) $documento['id_documento'], (string) $documento['tipo'], (string) $documento['numero'], (string) $documento['titulo']),
        );
    }

    /**
     * @param  array<string, mixed>  $documento  Fila de `sp_documento_por_vencer`.
     */
    public function documentoPorVencer(array $documento, int $dias): void
    {
        $this->enviar(
            $this->correosArea($documento),
            new DocumentoPorVencerMail((int) $documento['id_documento'], (string) $documento['tipo'], (string) $documento['numero'], (string) $documento['titulo'], $dias),
        );
    }

    /**
     * @param  array<string, mixed>  $campana  Fila de `sp_campana_cerrar_vencidas`.
     */
    public function campanaCerrada(array $campana): void
    {
        $comision = config('portal.correo_comision_admision');
        $correos = is_string($comision) && $comision !== ''
            ? [$comision]
            : $this->destinatarios->correosActivosPorRol('Revisor');

        $this->enviar(
            $correos,
            new CampanaCerradaMail((int) $campana['id_campana'], (int) $campana['anio'], $campana['proceso'] === null ? null : (string) $campana['proceso']),
        );
    }

    /**
     * @param  array<string, mixed>  $documento
     * @return list<string>
     */
    private function correosArea(array $documento): array
    {
        $correo = $documento['correo_departamento'] ?? null;

        return is_string($correo) && $correo !== ''
            ? [$correo]
            : $this->destinatarios->correosActivosPorRol('Revisor');
    }

    /**
     * @param  list<string>  $correos
     */
    private function enviar(array $correos, Mailable $correo): void
    {
        foreach ($correos as $destino) {
            try {
                Mail::to($destino)->send(clone $correo);
            } catch (Throwable $error) {
                Log::warning('No se pudo enviar el aviso de documentos y admisión.', ['error' => $error->getMessage()]);
            }
        }
    }
}
