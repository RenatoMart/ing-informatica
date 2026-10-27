<?php

namespace App\Console\Commands;

use App\Aplicacion\DocumentosAdmision\DocumentosServicio;
use Illuminate\Console\Command;

/**
 * Tarea diaria (00:15, la programa B9): avisa al área emisora de los documentos que vencen dentro
 * de `config('portal.dias_aviso_vencimiento')` días (4.9). Como la fecha es exacta, no repite avisos.
 */
class AvisarVencimientos extends Command
{
    /** @var string */
    protected $signature = 'portal:avisar-vencimientos';

    /** @var string */
    protected $description = 'Avisa al área emisora de los documentos oficiales que están por vencer';

    public function handle(DocumentosServicio $documentos): int
    {
        $total = $documentos->avisarPorVencer();

        $this->info("Avisos de vencimiento enviados: {$total}.");

        return self::SUCCESS;
    }
}
