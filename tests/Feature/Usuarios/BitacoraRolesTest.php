<?php

namespace Tests\Feature\Usuarios;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Tests\Concerns\DatosUsuarios;
use Tests\TestCase;

/**
 * Bitácora paginada con filtros, listado de roles y comando `portal:crear-usuario`.
 */
class BitacoraRolesTest extends TestCase
{
    use DatosUsuarios;

    protected function setUp(): void
    {
        parent::setUp();

        Mail::fake();
        $this->sembrarRoles();
    }

    public function test_bitacora_paginada_con_filtros(): void
    {
        $correo = $this->correoPrueba('bitacora');
        $editor = $this->crearUsuario('Editor', ['correo' => $correo]);
        $admin = $this->crearUsuario('Administrador');

        $this->postJson('/api/panel/auth/login', ['correo' => $correo, 'contrasena' => 'malaClave1'])->assertUnprocessable();
        $this->postJson('/api/panel/auth/login', ['correo' => $correo, 'contrasena' => self::CONTRASENA_PRUEBA])->assertOk();
        $this->app['auth']->forgetGuards();

        $hoy = now()->format('Y-m-d');

        $this->actuarComo($admin)
            ->getJson("/api/panel/bitacora?id_usuario={$editor}&accion=acceso_fallido&desde={$hoy}&hasta={$hoy}")
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.usuario.id_usuario', $editor)
            ->assertJsonPath('data.0.actor', null)
            ->assertJsonPath('data.0.ip', '127.0.0.1');

        $this->getJson("/api/panel/bitacora?id_usuario={$editor}&por_pagina=2")
            ->assertOk()
            ->assertJsonPath('meta.total', 3)
            ->assertJsonPath('meta.ultima_pagina', 2)
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.accion', 'inicio_sesion');

        $this->getJson('/api/panel/bitacora?accion=inventada')->assertUnprocessable();
        $this->getJson('/api/panel/bitacora?desde=2026-10-10&hasta=2026-10-01')->assertUnprocessable();
    }

    public function test_listado_de_roles(): void
    {
        $this->actuarComo($this->crearUsuario('Editor'))
            ->getJson('/api/panel/roles')
            ->assertOk()
            ->assertJsonCount(3, 'data')
            ->assertJsonStructure(['data' => [['id_rol', 'nombre', 'descripcion']]]);
    }

    public function test_comando_crear_usuario_imprime_la_temporal_una_vez(): void
    {
        $correo = $this->correoPrueba('primer.admin');

        $this->artisan('portal:crear-usuario', [
            'correo' => $correo,
            'rol' => 'Administrador',
            '--nombres' => 'Primer',
            '--apellidos' => 'Administrador',
            '--cargo' => 'Administrador del Portal',
        ])->expectsOutputToContain('Contraseña temporal')->assertSuccessful();

        $fila = DB::table('usuario')->where('correo_institucional', $correo)->first();
        $this->assertNotNull($fila);
        $this->assertTrue($fila->debe_cambiar_contrasena);
        $this->assertSame('Administrador del Portal', $fila->cargo);

        $this->artisan('portal:crear-usuario', ['correo' => 'x@gmail.com', 'rol' => 'Administrador', '--nombres' => 'X', '--apellidos' => 'Y'])->assertFailed();
        $this->artisan('portal:crear-usuario', ['correo' => $correo, 'rol' => 'Jefe', '--nombres' => 'X', '--apellidos' => 'Y'])->assertFailed();
    }
}
