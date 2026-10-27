<?php

namespace App\Aplicacion\DocumentosAdmision\Correos;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Aviso al área emisora: el documento oficial venció y pasó a `vencido` (P7).
 */
class DocumentoVencidoMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public int $idDocumento,
        public string $tipo,
        public string $numero,
        public string $titulo,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: "Documento vencido: {$this->tipo} {$this->numero}");
    }

    public function content(): Content
    {
        $tipo = e($this->tipo);
        $numero = e($this->numero);
        $titulo = e($this->titulo);
        $url = e(config('portal.url_panel').'/documentos');

        return new Content(htmlString: <<<HTML
            <p>La vigencia del documento <strong>{$tipo} {$numero}</strong> ({$titulo}) terminó y ya no figura como vigente en el sitio público.</p>
            <p>Si hay una versión nueva, regístrela como reemplazo para que quede enlazada a la anterior.</p>
            <p><a href="{$url}">Abrir documentos en el panel</a></p>
            HTML);
    }
}
