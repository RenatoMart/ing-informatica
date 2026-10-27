<?php

namespace App\Aplicacion\ConsultasVisitas\Correos;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Reorienta al visitante al canal adecuado cuando su consulta es externa.
 */
class ReorientacionConsultaMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public string $nombre, public string $orientacion) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Sobre su consulta a la Escuela de Informática');
    }

    public function content(): Content
    {
        $nombre = e($this->nombre);
        $orientacion = nl2br(e($this->orientacion));

        return new Content(htmlString: "<p>Hola {$nombre},</p><p>Su consulta corresponde a otro canal:</p><p>{$orientacion}</p>");
    }
}
