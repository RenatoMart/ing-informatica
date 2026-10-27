<?php

namespace App\Aplicacion\Compartido\Correos;

use App\Dominio\Revision\EntidadRevisable;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Aviso a los revisores: hay contenido nuevo (o un cambio/baja) esperando decisión.
 */
class ContenidoEnRevisionMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public EntidadRevisable $entidad,
        public int $idRegistro,
        public string $titulo,
        public string $operacion = 'revision',
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Pendiente de revisión: '.$this->entidad->etiqueta());
    }

    public function content(): Content
    {
        $titulo = e($this->titulo);
        $entidad = e($this->entidad->etiqueta());
        $operacion = match ($this->operacion) {
            'cambio' => 'un cambio sobre contenido publicado',
            'baja' => 'una solicitud de baja',
            default => 'un registro nuevo',
        };
        $url = e(config('portal.url_panel').'/revision');

        return new Content(htmlString: <<<HTML
            <p>Hay {$operacion} esperando su revisión.</p>
            <p><strong>{$entidad}:</strong> {$titulo} (#{$this->idRegistro})</p>
            <p><a href="{$url}">Abrir la bandeja de revisión</a></p>
            HTML);
    }
}
