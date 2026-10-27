<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

/**
 * Base de las pruebas que arrancan la aplicación (rutas, middlewares, fakes de Http/Storage/Mail)
 * pero **no** tocan la BD. La conexión por defecto apunta a una conexión inexistente: cualquier
 * consulta accidental falla en lugar de llegar a Neon.
 */
abstract class TestCaseSinBaseDatos extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config([
            'database.default' => 'sin_base_de_datos',
            'session.driver' => 'array',
            'cache.default' => 'array',
        ]);
    }
}
