<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/*
 * Tareas programadas (sección 4.9), zona America/Lima. Producción: `php artisan schedule:work`.
 */
Schedule::command('portal:vencer-documentos')->dailyAt('00:10')->timezone('America/Lima');
Schedule::command('portal:avisar-vencimientos')->dailyAt('00:15')->timezone('America/Lima');
Schedule::command('portal:cerrar-campanas')->dailyAt('00:20')->timezone('America/Lima');
Schedule::command('portal:escalar-consultas')->weekdays()->at('08:00')->timezone('America/Lima');
Schedule::command('portal:purgar-tokens')->dailyAt('03:00')->timezone('America/Lima');
