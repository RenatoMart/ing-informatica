<?php

namespace Tests\Feature\Usuarios;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Tests\Concerns\DatosUsuarios;
use Tests\TestCase;

/**
 * HU1: login → yo → cambio obligatorio → logout, CSRF, rate limit y bloqueo por intentos.
 */
class AutenticacionTest extends TestCase
{
    use DatosUsuarios;

    protected function setUp(): void
    {
        parent::setUp();

        Mail::fake();
        $this->sembrarRoles();
    }

    public function test_flujo_login_yo_cambio_obligatorio_y_logout(): void
    {
        $correo = $this->correoPrueba('secretaria');
        $id = $this->crearUsuario('Editor', ['correo' => $correo, 'cargo' => 'Secretaria de Dirección', 'debe_cambiar_contrasena' => true]);

        $this->postJson('/api/panel/auth/login', ['correo' => strtoupper($correo), 'contrasena' => self::CONTRASENA_PRUEBA])
            ->assertOk()
            ->assertJsonPath('data.usuario.id_usuario', $id)
            ->assertJsonPath('data.usuario.rol', 'Editor')
            ->assertJsonPath('data.usuario.cargo', 'Secretaria de Dirección')
            ->assertJsonPath('data.usuario.debe_cambiar_contrasena', true);

        $this->assertAuthenticated();
        $this->assertSame(1, DB::table('bitacora_acceso')->where(['id_usuario' => $id, 'accion' => 'inicio_sesion', 'ip' => '127.0.0.1'])->count());

        $this->getJson('/api/panel/roles')
            ->assertForbidden()
            ->assertJsonPath('error.codigo', 'CAMBIO_CONTRASENA_REQUERIDO');

        $this->getJson('/api/panel/auth/yo')
            ->assertOk()
            ->assertJsonPath('data.correo_institucional', $correo)
            ->assertJsonPath('data.rol_etiqueta', 'Editor de contenidos')
            ->assertJsonPath('data.debe_cambiar_contrasena', true)
            ->assertJsonFragment(['permisos' => ['gestionar_sesion_propia', 'ver_dashboard', 'ver_estadisticas', 'editar_contenido', 'gestionar_departamentos', 'atender_consultas']]);

        $this->postJson('/api/panel/auth/cambiar-contrasena', [
            'contrasena_actual' => self::CONTRASENA_PRUEBA,
            'contrasena_nueva' => 'soloLetrasLargas',
            'contrasena_nueva_confirmation' => 'soloLetrasLargas',
        ])->assertUnprocessable()->assertJsonPath('error.codigo', 'REGLA_NEGOCIO')->assertJsonStructure(['error' => ['campos' => ['contrasena_nueva']]]);

        $this->postJson('/api/panel/auth/cambiar-contrasena', [
            'contrasena_actual' => self::CONTRASENA_PRUEBA,
            'contrasena_nueva' => self::CONTRASENA_PRUEBA,
            'contrasena_nueva_confirmation' => self::CONTRASENA_PRUEBA,
        ])->assertUnprocessable()->assertJsonPath('error.campos.contrasena_nueva.0', 'La nueva contraseña debe ser distinta de la actual.');

        $this->postJson('/api/panel/auth/cambiar-contrasena', [
            'contrasena_actual' => 'incorrecta123',
            'contrasena_nueva' => 'NuevaClave2026',
            'contrasena_nueva_confirmation' => 'NuevaClave2026',
        ])->assertUnprocessable()->assertJsonStructure(['error' => ['campos' => ['contrasena_actual']]]);

        $this->postJson('/api/panel/auth/cambiar-contrasena', [
            'contrasena_actual' => self::CONTRASENA_PRUEBA,
            'contrasena_nueva' => 'NuevaClave2026',
            'contrasena_nueva_confirmation' => 'NuevaClave2026',
        ])->assertNoContent();

        $fila = DB::table('usuario')->where('id_usuario', $id)->first();
        $this->assertFalse($fila->debe_cambiar_contrasena);
        $this->assertTrue(Hash::check('NuevaClave2026', $fila->contrasena_hash));
        $this->assertSame(1, $this->contarBitacora($id, 'cambio_contrasena'));

        $this->getJson('/api/panel/roles')->assertOk()->assertJsonCount(3, 'data');

        $this->postJson('/api/panel/auth/logout')->assertNoContent();
        $this->assertGuest();
        $this->assertSame(1, $this->contarBitacora($id, 'cierre_sesion'));

        $this->getJson('/api/panel/auth/yo')->assertUnauthorized()->assertJsonPath('error.codigo', 'NO_AUTENTICADO');
    }

    public function test_contrasena_erronea_da_mensaje_generico_y_registra_acceso_fallido(): void
    {
        $correo = $this->correoPrueba('editor');
        $id = $this->crearUsuario('Editor', ['correo' => $correo]);

        $incorrecta = $this->postJson('/api/panel/auth/login', ['correo' => $correo, 'contrasena' => 'otraClave99'])
            ->assertUnprocessable()
            ->assertJsonPath('error.codigo', 'CREDENCIALES_INVALIDAS');

        $inexistente = $this->postJson('/api/panel/auth/login', ['correo' => $this->correoPrueba('nadie'), 'contrasena' => 'otraClave99'])
            ->assertUnprocessable()
            ->assertJsonPath('error.codigo', 'CREDENCIALES_INVALIDAS');

        $this->assertSame($incorrecta->json('error.mensaje'), $inexistente->json('error.mensaje'));
        $this->assertSame(1, DB::table('bitacora_acceso')->where(['id_usuario' => $id, 'accion' => 'acceso_fallido', 'ip' => '127.0.0.1'])->count());
        $this->assertGuest();
    }

    public function test_cuenta_inactiva_da_403_y_registra_denegado(): void
    {
        $correo = $this->correoPrueba('inactivo');
        $id = $this->crearUsuario('Editor', ['correo' => $correo]);
        DB::table('usuario')->where('id_usuario', $id)->update(['estado' => 'inactivo']);

        $this->postJson('/api/panel/auth/login', ['correo' => $correo, 'contrasena' => self::CONTRASENA_PRUEBA])
            ->assertForbidden()
            ->assertJsonPath('error.codigo', 'CUENTA_INACTIVA');

        $this->assertSame(1, $this->contarBitacora($id, 'denegado'));
        $this->assertGuest();
    }

    public function test_sexto_intento_por_minuto_da_429(): void
    {
        $correo = $this->correoPrueba('limite');
        $this->crearUsuario('Editor', ['correo' => $correo]);

        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/panel/auth/login', ['correo' => $correo, 'contrasena' => 'malaClave'.$i])->assertUnprocessable();
        }

        $this->postJson('/api/panel/auth/login', ['correo' => $correo, 'contrasena' => self::CONTRASENA_PRUEBA])
            ->assertTooManyRequests()
            ->assertJsonPath('error.codigo', 'DEMASIADOS_INTENTOS');
    }

    public function test_bloqueo_temporal_de_la_cuenta_aunque_cambie_la_ip(): void
    {
        $correo = $this->correoPrueba('bloqueo');
        $this->crearUsuario('Editor', ['correo' => $correo]);

        for ($i = 0; $i < 10; $i++) {
            $this->withServerVariables(['REMOTE_ADDR' => '10.0.0.'.($i + 1)])
                ->postJson('/api/panel/auth/login', ['correo' => $correo, 'contrasena' => 'malaClave'.$i])
                ->assertUnprocessable();
        }

        $this->withServerVariables(['REMOTE_ADDR' => '10.0.1.1'])
            ->postJson('/api/panel/auth/login', ['correo' => $correo, 'contrasena' => self::CONTRASENA_PRUEBA])
            ->assertTooManyRequests()
            ->assertJsonPath('error.codigo', 'DEMASIADOS_INTENTOS');

        $this->assertGuest();
    }

    public function test_sin_token_csrf_responde_419_y_con_token_funciona(): void
    {
        $correo = $this->correoPrueba('csrf');
        $this->crearUsuario('Editor', ['correo' => $correo]);
        $this->activarCsrf();

        $this->postJson('/api/panel/auth/login', ['correo' => $correo, 'contrasena' => self::CONTRASENA_PRUEBA])
            ->assertStatus(419)
            ->assertJsonPath('error.codigo', 'CSRF_VENCIDO');

        $this->withSession(['_token' => 'token-csrf-prueba'])
            ->withHeader('X-CSRF-TOKEN', 'token-csrf-prueba')
            ->postJson('/api/panel/auth/login', ['correo' => $correo, 'contrasena' => self::CONTRASENA_PRUEBA])
            ->assertOk();
    }

    public function test_sesion_queda_en_la_tabla_sessions_con_el_usuario(): void
    {
        $correo = $this->correoPrueba('sesion');
        $id = $this->crearUsuario('Editor', ['correo' => $correo]);

        $this->postJson('/api/panel/auth/login', ['correo' => $correo, 'contrasena' => self::CONTRASENA_PRUEBA])->assertOk();

        $this->assertSame('database', config('session.driver'));
        $this->assertSame(1, DB::table('sessions')->where('user_id', $id)->count());
    }

    public function test_validacion_del_login_en_espanol(): void
    {
        $this->postJson('/api/panel/auth/login', [])
            ->assertUnprocessable()
            ->assertJsonPath('error.codigo', 'VALIDACION')
            ->assertJsonStructure(['error' => ['campos' => ['correo', 'contrasena']]]);
    }
}
