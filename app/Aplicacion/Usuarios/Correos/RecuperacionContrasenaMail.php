<?php

namespace App\Aplicacion\Usuarios\Correos;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Enlace temporal de restablecimiento de contraseña (3.4, paso 6).
 */
class RecuperacionContrasenaMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public string $enlace, public int $minutosVigencia) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Restablecer su contraseña del panel');
    }

    public function content(): Content
    {
        $enlace = e($this->enlace);

        return new Content(htmlString: <<<HTML
            <p>Recibimos una solicitud para restablecer su contraseña del panel del Portal de Dirección de Escuela.</p>
            <p><a href="{$enlace}">Restablecer contraseña</a></p>
            <p>El enlace vence en {$this->minutosVigencia} minutos y solo se puede usar una vez.</p>
            <p>Si usted no lo solicitó, ignore este correo: su contraseña no cambiará.</p>
            HTML);
    }
}
