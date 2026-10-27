<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Semillas de la aplicación. Los roles y departamentos base los crea la migración del esquema
     * (90_semillas_base.sql); el contenido inicial lo agrega el paquete B10.
     */
    public function run(): void
    {
        //
    }
}
