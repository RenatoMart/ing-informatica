<?php

namespace Tests;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use RuntimeException;
use Tests\Concerns\CreaDatosPortal;

/**
 * Base de las pruebas feature con BD real (PostgreSQL, schema `pruebas`, sección 9).
 *
 * `RefreshDatabase` hace un `migrate:fresh` por ejecución y una transacción por prueba; ya incluye la
 * transacción, así que las subclases no deben añadir `DatabaseTransactions`.
 * Antes de tocar la BD se verifica que se cargó `.env.testing` y que el `search_path` no incluye
 * `public`: `migrate:fresh` borra todas las tablas de los schemas del `search_path`.
 */
abstract class TestCase extends BaseTestCase
{
    use CreaDatosPortal;
    use RefreshDatabase {
        refreshDatabase as protected refrescarBaseDatosLaravel;
    }

    protected bool $dropViews = true;

    protected bool $dropTypes = true;

    public function refreshDatabase(): void
    {
        $this->verificarBaseDatosDePruebas();
        $this->refrescarBaseDatosLaravel();
    }

    /**
     * Guardia contra la BD de producción.
     *
     * @throws RuntimeException
     */
    protected function verificarBaseDatosDePruebas(): void
    {
        if ($this->app->environmentFile() !== '.env.testing' || ! is_file($this->app->environmentFilePath())) {
            throw new RuntimeException('Las pruebas con BD requieren .env.testing (copie .env.testing.example).');
        }

        $conexion = (string) config('database.default');

        if (config("database.connections.{$conexion}.driver") !== 'pgsql') {
            throw new RuntimeException('Las pruebas con BD requieren la conexión pgsql (no se usa SQLite).');
        }

        $esquemas = array_filter(array_map(
            static fn (string $esquema): string => strtolower(trim($esquema, " \t\"'")),
            explode(',', (string) config("database.connections.{$conexion}.search_path")),
        ));

        if ($esquemas === [] || in_array('public', $esquemas, true)) {
            throw new RuntimeException('DB_SEARCH_PATH de pruebas no puede estar vacío ni incluir "public" (use "pruebas").');
        }
    }
}
