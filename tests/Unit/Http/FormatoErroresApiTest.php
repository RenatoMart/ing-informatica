<?php

namespace Tests\Unit\Http;

use App\Dominio\Compartido\Excepciones\AccesoDenegadoException;
use App\Dominio\Compartido\Excepciones\ConflictoException;
use App\Dominio\Compartido\Excepciones\NoEncontradoException;
use App\Dominio\Compartido\Excepciones\ReglaNegocioException;
use App\Dominio\Compartido\Excepciones\TransicionInvalidaException;
use Illuminate\Http\Request;
use Illuminate\Session\TokenMismatchException;
use Illuminate\Support\Facades\Route;
use RuntimeException;
use Tests\TestCaseSinBaseDatos;

/**
 * El manejador global responde en `api/*` con el formato de error de la sección 5.1.
 * Las rutas se registran solo dentro de la prueba.
 */
class FormatoErroresApiTest extends TestCaseSinBaseDatos
{
    protected function setUp(): void
    {
        parent::setUp();

        Route::middleware('api')->prefix('api/publico/_prueba')->group(function (): void {
            Route::post('validacion', fn (Request $request) => $request->validate(['titulo' => ['required', 'min:5']]));
            Route::get('regla', fn () => throw new ReglaNegocioException('Debe adjuntar al menos una imagen.', 'imagenes'));
            Route::get('transicion', fn () => throw new TransicionInvalidaException('Acción no permitida en estado publicada.'));
            Route::get('duplicado', fn () => throw new ConflictoException('Ya existe un registro con esos datos.', 'codigo'));
            Route::get('no-encontrado', fn () => throw new NoEncontradoException('No hay campaña vigente.', null, 'SIN_CAMPANA_VIGENTE'));
            Route::get('denegado', fn () => throw new AccesoDenegadoException('No puede revisar contenido que usted editó.'));
            Route::get('csrf', fn () => throw new TokenMismatchException('CSRF token mismatch.'));
            Route::get('interno', fn () => throw new RuntimeException('detalle interno'));
            Route::get('protegida', fn () => 'ok')->middleware('auth');
            Route::get('limitada', fn () => 'ok')->middleware('throttle:2,1');
            Route::post('solo-post', fn () => 'ok');
        });
    }

    public function test_validacion_422(): void
    {
        $this->postJson('api/publico/_prueba/validacion', ['titulo' => 'abc'])
            ->assertStatus(422)
            ->assertExactJson(['error' => [
                'codigo' => 'VALIDACION',
                'mensaje' => 'Revise los campos marcados.',
                'campos' => ['titulo' => ['El campo título debe contener al menos 5 caracteres.']],
            ]]);
    }

    public function test_regla_de_negocio_422_con_campo(): void
    {
        $this->getJson('api/publico/_prueba/regla')
            ->assertStatus(422)
            ->assertExactJson(['error' => [
                'codigo' => 'REGLA_NEGOCIO',
                'mensaje' => 'Debe adjuntar al menos una imagen.',
                'campos' => ['imagenes' => ['Debe adjuntar al menos una imagen.']],
            ]]);
    }

    public function test_transicion_invalida_409_sin_campos(): void
    {
        $this->getJson('api/publico/_prueba/transicion')
            ->assertStatus(409)
            ->assertExactJson(['error' => ['codigo' => 'ESTADO_INVALIDO', 'mensaje' => 'Acción no permitida en estado publicada.']]);
    }

    public function test_duplicado_409(): void
    {
        $this->getJson('api/publico/_prueba/duplicado')
            ->assertStatus(409)
            ->assertJsonPath('error.codigo', 'DUPLICADO')
            ->assertJsonPath('error.campos.codigo.0', 'Ya existe un registro con esos datos.');
    }

    public function test_no_encontrado_404_con_codigo_propio(): void
    {
        $this->getJson('api/publico/_prueba/no-encontrado')
            ->assertStatus(404)
            ->assertExactJson(['error' => ['codigo' => 'SIN_CAMPANA_VIGENTE', 'mensaje' => 'No hay campaña vigente.']]);
    }

    public function test_ruta_api_inexistente_404_json_y_no_la_spa(): void
    {
        $this->get('api/publico/no-existe')
            ->assertStatus(404)
            ->assertExactJson(['error' => ['codigo' => 'NO_ENCONTRADO', 'mensaje' => 'Recurso no encontrado.']]);
    }

    public function test_acceso_denegado_403(): void
    {
        $this->getJson('api/publico/_prueba/denegado')
            ->assertStatus(403)
            ->assertJsonPath('error.codigo', 'ROL_NO_AUTORIZADO');
    }

    public function test_sin_sesion_401_aunque_no_pida_json(): void
    {
        $this->get('api/publico/_prueba/protegida')
            ->assertStatus(401)
            ->assertExactJson(['error' => ['codigo' => 'NO_AUTENTICADO', 'mensaje' => 'Debe iniciar sesión.']]);
    }

    public function test_csrf_vencido_419(): void
    {
        $this->getJson('api/publico/_prueba/csrf')
            ->assertStatus(419)
            ->assertJsonPath('error.codigo', 'CSRF_VENCIDO');
    }

    public function test_demasiados_intentos_429_con_retry_after(): void
    {
        $this->getJson('api/publico/_prueba/limitada')->assertOk();
        $this->getJson('api/publico/_prueba/limitada')->assertOk();

        $this->getJson('api/publico/_prueba/limitada')
            ->assertStatus(429)
            ->assertHeader('Retry-After')
            ->assertJsonPath('error.codigo', 'DEMASIADOS_INTENTOS');
    }

    public function test_metodo_no_permitido_405(): void
    {
        $this->getJson('api/publico/_prueba/solo-post')
            ->assertStatus(405)
            ->assertJsonPath('error.codigo', 'METODO_NO_PERMITIDO');
    }

    public function test_error_inesperado_500_sin_detalle_en_produccion(): void
    {
        config(['app.debug' => false]);

        $this->getJson('api/publico/_prueba/interno')
            ->assertStatus(500)
            ->assertExactJson(['error' => ['codigo' => 'ERROR_INTERNO', 'mensaje' => 'Ocurrió un error inesperado. Intente nuevamente más tarde.']]);
    }

    public function test_el_comodin_de_la_spa_excluye_storage_y_build(): void
    {
        $this->withoutVite();

        $this->get('/storage/no-existe.webp')->assertNotFound();
        $this->get('/build/assets/no-existe.js')->assertNotFound();
        $this->get('/organizacion/docentes')->assertOk()->assertViewIs('app');
        $this->get('/panel/login')->assertOk()->assertViewIs('app');
        $this->get('/apiario')->assertOk()->assertViewIs('app');
    }
}
