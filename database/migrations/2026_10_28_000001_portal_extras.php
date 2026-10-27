<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Aplica los elementos EXTRA del diseno (seccion 3.5) ejecutando database/sql/04_extras.sql.
 * El script es idempotente. El down() solo revierte lo agregado aqui y no toca datos del diccionario.
 */
return new class extends Migration
{
    /** Aplica el script de extras. */
    public function up(): void
    {
        DB::unprepared(file_get_contents(database_path('sql/04_extras.sql')));
    }

    /** Revierte tablas, columnas y restricciones agregadas por 04_extras.sql. */
    public function down(): void
    {
        DB::unprepared(<<<'SQL'
ALTER TABLE publicacion DROP CONSTRAINT IF EXISTS ck_publicacion_revisor;
ALTER TABLE docente DROP CONSTRAINT IF EXISTS ck_docente_revisor, DROP CONSTRAINT IF EXISTS ck_encuadre;
ALTER TABLE plan_estudios DROP CONSTRAINT IF EXISTS ck_plan_estudios_revisor;
ALTER TABLE documento_oficial DROP CONSTRAINT IF EXISTS ck_documento_oficial_revisor;
ALTER TABLE campana_admision DROP CONSTRAINT IF EXISTS ck_campana_admision_revisor;
ALTER TABLE bitacora_acceso DROP CONSTRAINT IF EXISTS ck_bitacora_accion;
DELETE FROM bitacora_acceso WHERE accion NOT IN ('alta','cambio_rol','baja','recuperacion','denegado');
ALTER TABLE bitacora_acceso ADD CONSTRAINT bitacora_acceso_accion_check
    CHECK (accion IN ('alta','cambio_rol','baja','recuperacion','denegado'));
DROP INDEX IF EXISTS ix_bitacora_actor;
DROP INDEX IF EXISTS ix_solicitud_objetivo;
ALTER TABLE usuario DROP COLUMN IF EXISTS cargo;
ALTER TABLE bitacora_acceso DROP COLUMN IF EXISTS id_usuario_actor, DROP COLUMN IF EXISTS ip;
ALTER TABLE solicitud_acceso DROP COLUMN IF EXISTS correo_solicitado, DROP COLUMN IF EXISTS id_usuario_objetivo,
    DROP COLUMN IF EXISTS observacion_resolucion, DROP COLUMN IF EXISTS fecha_ejecucion;
ALTER TABLE departamento DROP COLUMN IF EXISTS correo;
ALTER TABLE publicacion DROP COLUMN IF EXISTS operacion_pendiente, DROP COLUMN IF EXISTS cambios_pendientes;
ALTER TABLE docente DROP COLUMN IF EXISTS operacion_pendiente, DROP COLUMN IF EXISTS cambios_pendientes;
ALTER TABLE curso DROP COLUMN IF EXISTS horas_teoria, DROP COLUMN IF EXISTS horas_practica, DROP COLUMN IF EXISTS descripcion;
ALTER TABLE documento_oficial DROP COLUMN IF EXISTS titulo;
ALTER TABLE consulta_contacto DROP COLUMN IF EXISTS fecha_clasificacion;
DROP TABLE IF EXISTS historial_revision, token_recuperacion, sessions;
SQL);
    }
};
