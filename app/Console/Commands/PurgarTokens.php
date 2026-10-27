<?php

namespace App\Console\Commands;

use App\Persistencia\Compartido\EjecutorProcedimientos;
use Illuminate\Console\Command;

/**
 * Diario 03:00 (4.9): borra los tokens de recuperación de contraseña antiguos.
 */
class PurgarTokens extends Command
{
    /** @var string */
    protected $signature = 'portal:purgar-tokens';

    /** @var string */
    protected $description = 'Borra los tokens de recuperación de contraseña vencidos';

    public function handle(EjecutorProcedimientos $sp): int
    {
        $this->info('Tokens purgados: '.(int) $sp->escalar('sp_token_recuperacion_purgar').'.');

        return self::SUCCESS;
    }
}
