<?php

namespace App\Console\Commands;

use App\Aplicacion\DocumentosAdmision\AdmisionServicio;
use Illuminate\Console\Command;

/**
 * Tarea diaria (00:20, la programa B9): cierra la campaña vigente cuya `fecha_fin` pasó y avisa
 * a la Comisión de Admisión (4.9).
 */
class CerrarCampanas extends Command
{
    /** @var string */
    protected $signature = 'portal:cerrar-campanas';

    /** @var string */
    protected $description = 'Cierra las campañas de admisión vencidas y avisa a la Comisión';

    public function handle(AdmisionServicio $admision): int
    {
        $total = $admision->cerrarVencidas();

        $this->info("Campañas cerradas: {$total}.");

        return self::SUCCESS;
    }
}
