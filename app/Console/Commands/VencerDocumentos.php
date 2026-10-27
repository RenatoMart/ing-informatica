<?php

namespace App\Console\Commands;

use App\Aplicacion\DocumentosAdmision\DocumentosServicio;
use Illuminate\Console\Command;

/**
 * Tarea diaria (00:10, la programa B9): pasa a `vencido` los documentos vigentes con la vigencia
 * terminada y avisa al área emisora (4.9).
 */
class VencerDocumentos extends Command
{
    /** @var string */
    protected $signature = 'portal:vencer-documentos';

    /** @var string */
    protected $description = 'Pasa a vencido los documentos oficiales con la vigencia terminada y avisa al área emisora';

    public function handle(DocumentosServicio $documentos): int
    {
        $total = $documentos->vencerExpirados();

        $this->info("Documentos vencidos: {$total}.");

        return self::SUCCESS;
    }
}
