<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/*
 * Crea el esquema del portal ejecutando database/sql/01_tablas.sql.
 * Los procedimientos (02_*.sql) y datos (03_*.sql) se aplican en migraciones
 * posteriores con el mismo patron: DB::unprepared(file_get_contents(...)).
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::unprepared(file_get_contents(database_path('sql/01_tablas.sql')));
    }

    public function down(): void
    {
        DB::unprepared(<<<'SQL'
DROP TABLE IF EXISTS registro_visita, cronograma_admision, modalidad_admision, campana_admision,
    documento_oficial, prerrequisito, curso, plan_estudios, consulta_contacto, especialidad_docente,
    docente, archivo_publicacion, publicacion, departamento, solicitud_acceso, bitacora_acceso,
    usuario, rol CASCADE;
DROP TYPE IF EXISTS estado_campana, estado_documento, tipo_documento, tipo_curso, estado_plan,
    estado_consulta, estado_docente, condicion_laboral, estado_publicacion, estado_solicitud,
    tipo_solicitud, estado_usuario CASCADE;
SQL);
    }
};
