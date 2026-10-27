<?php

namespace App\Console\Commands;

use App\Aplicacion\ConsultasVisitas\ConsultasServicio;
use Illuminate\Console\Command;

/**
 * Días hábiles 08:00 (4.9): avisa a los revisores de las consultas fuera de plazo.
 */
class EscalarConsultas extends Command
{
    /** @var string */
    protected $signature = 'portal:escalar-consultas';

    /** @var string */
    protected $description = 'Avisa a los revisores de las consultas fuera de plazo';

    public function handle(ConsultasServicio $consultas): int
    {
        $this->info('Consultas vencidas: '.$consultas->escalarVencidas().'.');

        return self::SUCCESS;
    }
}
