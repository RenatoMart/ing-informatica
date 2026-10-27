<?php

namespace App\Aplicacion\ConsultasVisitas\Correos;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Resumen a los revisores de las consultas fuera de plazo (escalamiento al Director).
 */
class ConsultasVencidasMail extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * @param  list<array<string, mixed>>  $vencidas
     */
    public function __construct(public array $vencidas) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Consultas fuera de plazo: '.count($this->vencidas));
    }

    public function content(): Content
    {
        $filas = '';
        foreach ($this->vencidas as $v) {
            $filas .= '<li>Consulta #'.(int) $v['id_consulta'].' ('.e((string) $v['estado']).'): '.(int) $v['dias_habiles'].' días hábiles, plazo '.(int) $v['plazo'].'.</li>';
        }
        $url = e(config('portal.url_panel').'/consultas');

        return new Content(htmlString: "<p>Hay consultas fuera de plazo:</p><ul>{$filas}</ul><p><a href=\"{$url}\">Abrir consultas</a></p>");
    }
}
