<?php

namespace App\Console\Commands;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Throwable;

#[Signature('portal:sql-funciones')]
#[Description('Vuelve a aplicar los scripts de procedimientos almacenados (database/sql/1*_sp_*.sql) y vistas (20_vistas.sql) sin migrar')]
class AplicarFuncionesSql extends Command
{
    /**
     * Rutas absolutas de los scripts de funciones y vistas, en orden de ejecución.
     *
     * @return list<string>
     */
    public static function archivos(): array
    {
        $archivos = glob(database_path('sql/1*_sp_*.sql')) ?: [];
        sort($archivos, SORT_STRING);

        $vistas = database_path('sql/20_vistas.sql');
        if (is_file($vistas)) {
            $archivos[] = $vistas;
        }

        return $archivos;
    }

    /**
     * Ejecuta cada script en su propia transacción. Son idempotentes (CREATE OR REPLACE).
     */
    public static function aplicar(?callable $alAplicar = null): void
    {
        foreach (self::archivos() as $archivo) {
            DB::transaction(fn () => DB::unprepared(file_get_contents($archivo)));

            if ($alAplicar !== null) {
                $alAplicar($archivo);
            }
        }
    }

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        if (self::archivos() === []) {
            $this->components->warn('No hay scripts de funciones en database/sql.');

            return self::SUCCESS;
        }

        try {
            self::aplicar(fn (string $archivo) => $this->components->task(basename($archivo)));
        } catch (Throwable $e) {
            $this->components->error($e->getMessage());

            return self::FAILURE;
        }

        $this->components->info('Funciones y vistas aplicadas en el schema '.DB::selectOne('select current_schema() as s')->s.'.');

        return self::SUCCESS;
    }
}
