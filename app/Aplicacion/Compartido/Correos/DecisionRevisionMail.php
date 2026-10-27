<?php

namespace App\Aplicacion\Compartido\Correos;

use App\Dominio\Revision\EntidadRevisable;
use App\Dominio\Revision\TipoDecision;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Aviso al editor: el revisor decidió sobre su contenido.
 */
class DecisionRevisionMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public EntidadRevisable $entidad,
        public int $idRegistro,
        public string $titulo,
        public TipoDecision $decision,
        public ?string $observaciones = null,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: $this->entidad->etiqueta().' '.$this->verbo());
    }

    public function content(): Content
    {
        $titulo = e($this->titulo);
        $entidad = e($this->entidad->etiqueta());
        $verbo = e($this->verbo());
        $observaciones = $this->observaciones === null ? '' : '<p><strong>Observaciones:</strong> '.nl2br(e($this->observaciones)).'</p>';
        $url = e(config('portal.url_panel'));

        return new Content(htmlString: <<<HTML
            <p><strong>{$entidad}:</strong> {$titulo} (#{$this->idRegistro}) fue {$verbo}.</p>
            {$observaciones}
            <p><a href="{$url}">Abrir el panel</a></p>
            HTML);
    }

    private function verbo(): string
    {
        return match ($this->decision) {
            TipoDecision::Aprobar => 'aprobado',
            TipoDecision::Observar => 'observado',
            TipoDecision::Descartar => 'descartado',
        };
    }
}
