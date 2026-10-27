<?php

namespace Tests\Unit\Http;

use App\Dominio\Compartido\UsuarioAutenticado;
use Illuminate\Auth\GenericUser;
use Illuminate\Support\Facades\Route;
use Tests\TestCaseSinBaseDatos;

/**
 * Middlewares `activo`, `cambio_contrasena`, `rol:` y limitador `login`, con un usuario falso
 * que cumple el contrato {@see UsuarioAutenticado} (el modelo real lo crea B4).
 */
class MiddlewaresPanelTest extends TestCaseSinBaseDatos
{
    protected function setUp(): void
    {
        parent::setUp();

        Route::middleware(['api', 'auth', 'activo', 'cambio_contrasena'])->prefix('api/panel')->group(function (): void {
            Route::get('auth/yo', fn () => response()->json(['data' => 'yo']));
            Route::get('publicaciones', fn () => response()->json(['data' => []]))->middleware('rol:Editor,Revisor');
            Route::get('usuarios', fn () => response()->json(['data' => []]))->middleware('rol:Administrador');
        });

        Route::middleware(['api', 'throttle:login'])->post('api/panel/_prueba/login', fn () => response()->noContent());
    }

    private function usuario(string $rol = 'Editor', bool $activo = true, bool $debeCambiar = false): UsuarioAutenticado&GenericUser
    {
        return new class(['id' => 7, 'remember_token' => null, 'rol' => $rol, 'activo' => $activo, 'debe_cambiar' => $debeCambiar]) extends GenericUser implements UsuarioAutenticado
        {
            public function idUsuario(): int
            {
                return (int) $this->attributes['id'];
            }

            public function nombreRol(): string
            {
                return (string) $this->attributes['rol'];
            }

            public function estaActivo(): bool
            {
                return (bool) $this->attributes['activo'];
            }

            public function debeCambiarContrasena(): bool
            {
                return (bool) $this->attributes['debe_cambiar'];
            }
        };
    }

    public function test_editor_activo_accede_a_su_modulo(): void
    {
        $this->actingAs($this->usuario('Editor'))
            ->getJson('api/panel/publicaciones')
            ->assertOk();
    }

    public function test_rol_no_autorizado_403(): void
    {
        $this->actingAs($this->usuario('Editor'))
            ->getJson('api/panel/usuarios')
            ->assertStatus(403)
            ->assertJsonPath('error.codigo', 'ROL_NO_AUTORIZADO');
    }

    public function test_usuario_inactivo_401_sesion_revocada(): void
    {
        $this->actingAs($this->usuario('Revisor', activo: false))
            ->getJson('api/panel/publicaciones')
            ->assertStatus(401)
            ->assertExactJson(['error' => ['codigo' => 'SESION_REVOCADA', 'mensaje' => 'Su cuenta fue desactivada. La sesión se cerró.']]);

        $this->assertGuest();
    }

    public function test_debe_cambiar_contrasena_bloquea_todo_salvo_auth_yo(): void
    {
        $usuario = $this->usuario('Revisor', debeCambiar: true);

        $this->actingAs($usuario)
            ->getJson('api/panel/publicaciones')
            ->assertStatus(403)
            ->assertJsonPath('error.codigo', 'CAMBIO_CONTRASENA_REQUERIDO');

        $this->actingAs($usuario)
            ->getJson('api/panel/auth/yo')
            ->assertOk();
    }

    public function test_sin_sesion_401(): void
    {
        $this->getJson('api/panel/publicaciones')
            ->assertStatus(401)
            ->assertJsonPath('error.codigo', 'NO_AUTENTICADO');
    }

    public function test_limitador_login_5_por_minuto_por_correo_e_ip(): void
    {
        for ($intento = 1; $intento <= 5; $intento++) {
            $this->postJson('api/panel/_prueba/login', ['correo' => 'editor@unitru.edu.pe'])->assertNoContent();
        }

        $this->postJson('api/panel/_prueba/login', ['correo' => 'EDITOR@unitru.edu.pe'])
            ->assertStatus(429)
            ->assertJsonPath('error.codigo', 'DEMASIADOS_INTENTOS');

        $this->postJson('api/panel/_prueba/login', ['correo' => 'otro@unitru.edu.pe'])->assertNoContent();
    }

    public function test_health_check_y_alias_de_middleware_registrados(): void
    {
        $this->get('up')->assertOk();
        $this->assertSame(['activo', 'cambio_contrasena', 'rol'], array_values(array_intersect(
            ['activo', 'cambio_contrasena', 'rol'],
            array_keys(app('router')->getMiddleware()),
        )));
    }
}
