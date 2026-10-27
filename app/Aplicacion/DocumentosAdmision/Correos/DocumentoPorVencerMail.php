<?php

namespace App\Aplicacion\DocumentosAdmision\Correos;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Aviso previo al área emisora: el documento oficial vence dentro de `$dias` días (P7).
 */
class DocumentoPorVencerMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public int $idDocumento,
        public string $tipo,
        public string $numero,
        public string $titulo,
        public int $dias,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: "Documento por vencer en {$this->dias} días: {$this->tipo} {$this->numero}");
    }

    public function content(): Content
    {
        $tipo = e($this->tipo);
        $numero = e($this->numero);
        $titulo = e($this->titulo);
        $url = e(config('portal.url_panel').'/documentos');

        return new Content(htmlString: <<<HTML
            <p>El documento <strong>{$tipo} {$numero}</strong> ({$titulo}) vence dentro de {$this->dias} días.</p>
            <p>Prepare la versión que lo reemplaza y regístrela antes de la fecha de vencimiento.</p>
            <p><a href="{$url}">Abrir documentos en el panel</a></p>
            HTML);
    }
}
