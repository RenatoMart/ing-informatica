<?php

use App\Console\Commands\AplicarFuncionesSql;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Aplica los scripts de procedimientos almacenados (10_..16_sp_*.sql) y vistas (20_vistas.sql).
 * Los mismos archivos los reaplica `php artisan portal:sql-funciones`.
 */
return new class extends Migration
{
    /** Crea o reemplaza las funciones sp_ y las vistas del portal. */
    public function up(): void
    {
        AplicarFuncionesSql::aplicar();
    }

    /** Elimina las vistas v_* y las funciones sp_* del schema activo (no toca datos). */
    public function down(): void
    {
        DB::unprepared(<<<'SQL'
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
              WHERE n.nspname = current_schema() AND c.relkind = 'v' AND c.relname LIKE 'v\_%' LOOP
        EXECUTE format('DROP VIEW IF EXISTS %I CASCADE', r.relname);
    END LOOP;
    FOR r IN SELECT p.oid::regprocedure AS firma FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
              WHERE n.nspname = current_schema() AND p.proname LIKE 'sp\_%' LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS %s CASCADE', r.firma);
    END LOOP;
END $$;
SQL);
    }
};
