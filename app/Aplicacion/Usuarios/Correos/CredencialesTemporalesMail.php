<?php

namespace App\Aplicacion\Usuarios\Correos;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Credenciales temporales de una cuenta nueva (alta ejecutada por el Administrador, 3.4).
 * Va en cola (`QUEUE_CONNECTION=sync` la envía en el acto); en desarrollo `MAIL_MAILER=log`.
 */
class CredencialesTemporalesMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $nombres,
        public string $correo,
        public string $contrasenaTemporal,
        public string $rolEtiqueta,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Su cuenta del Portal de Dirección de Escuela');
    }

    public function content(): Content
    {
        $nombres = e($this->nombres);
        $correo = e($this->correo);
        $temporal = e($this->contrasenaTemporal);
        $rol = e($this->rolEtiqueta);
        $url = e(config('portal.url_panel').'/login');

        return new Content(htmlString: <<<HTML
            <p>Hola, {$nombres}:</p>
            <p>Se creó su cuenta en el panel del Portal de Dirección de Escuela con el rol <strong>{$rol}</strong>.</p>
            <p>Usuario: <strong>{$correo}</strong><br>Contraseña temporal: <strong>{$temporal}</strong></p>
            <p>Al ingresar se le pedirá cambiar la contraseña. <a href="{$url}">Ingresar al panel</a></p>
            <p>Si no reconoce esta solicitud, comuníquese con la Dirección de Escuela.</p>
            HTML);
    }
}
