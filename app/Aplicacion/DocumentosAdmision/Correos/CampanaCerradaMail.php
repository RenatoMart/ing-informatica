<?php

namespace App\Aplicacion\DocumentosAdmision\Correos;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Aviso a la Comisión de Admisión: la campaña terminó y pasó a `cerrada` (P8).
 */
class CampanaCerradaMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public int $idCampana,
        public int $anio,
        public ?string $proceso,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: "Campaña de admisión cerrada: {$this->etiqueta()}");
    }

    public function content(): Content
    {
        $etiqueta = e($this->etiqueta());
        $url = e(config('portal.url_panel').'/campanas');

        return new Content(htmlString: <<<HTML
            <p>La campaña de admisión <strong>{$etiqueta}</strong> terminó y se cerró: el sitio público ya no la muestra.</p>
            <p>Prepare la campaña siguiente (puede duplicar esta) y envíela a revisión.</p>
            <p><a href="{$url}">Abrir campañas en el panel</a></p>
            HTML);
    }

    private function etiqueta(): string
    {
        return $this->proceso === null ? (string) $this->anio : "{$this->anio}-{$this->proceso}";
    }
}
