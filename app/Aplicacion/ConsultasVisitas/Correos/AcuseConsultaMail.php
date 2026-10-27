<?php

namespace App\Aplicacion\ConsultasVisitas\Correos;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Acuse de recibo al visitante que envió una consulta.
 */
class AcuseConsultaMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public string $nombre, public int $idConsulta, public string $mensaje) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Recibimos su consulta (#'.$this->idConsulta.')');
    }

    public function content(): Content
    {
        $nombre = e($this->nombre);
        $mensaje = nl2br(e($this->mensaje));

        return new Content(htmlString: "<p>Hola {$nombre}, recibimos su consulta y la atenderemos en un máximo de 7 días hábiles.</p><p><strong>Su mensaje:</strong></p><p>{$mensaje}</p>");
    }
}
