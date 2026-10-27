<?php

namespace App\Aplicacion\ConsultasVisitas\Correos;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Respuesta de la Escuela al visitante.
 */
class RespuestaConsultaMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public string $nombre, public string $respuesta, public ?string $asunto = null) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Respuesta a su consulta'.($this->asunto ? ': '.$this->asunto : ''));
    }

    public function content(): Content
    {
        $nombre = e($this->nombre);
        $respuesta = nl2br(e($this->respuesta));

        return new Content(htmlString: "<p>Hola {$nombre},</p><p>{$respuesta}</p><p>Escuela de Ingeniería Informática.</p>");
    }
}
