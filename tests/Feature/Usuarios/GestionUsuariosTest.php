<?php

namespace Tests\Feature\Usuarios;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Tests\Concerns\DatosUsuarios;
use Tests\TestCase;

/**
 * Usuarios: listar/ver/editar, cambio de rol, baja que revoca sesiones, último Administrador y permisos 3.3.
 */
class GestionUsuariosTest extends TestCase
{
    use DatosUsuarios;

    private int $admin;

    private int $revisor;

    protected function setUp(): void
    {
        parent::setUp();

        Mail::fake();
        $this->sembrarRoles();
        $this->admin = $this->crearUsuario('Administrador', ['correo' => $this->correoPrueba('admin')]);
        $this->revisor = $this->crearUsuario('Revisor', ['correo' => $this->correoPrueba('director')]);
    }

    public function test_baja_desactiva_y_revoca_la_sesion_abierta(): void
    {
        $correo = $this->correoPrueba('saliente');
        $editor = $this->crearUsuario('Editor', ['correo' => $correo]);

        $login = $this->postJson('/api/panel/auth/login', ['correo' => $correo, 'contrasena' => self::CONTRASENA_PRUEBA])->assertOk();
        $cookieSesion = $login->getCookie((string) config('session.cookie'), false);
        $this->assertNotNull($cookieSesion);
        $this->assertSame(1, DB::table('sessions')->where('user_id', $editor)->count());

        $idSolicitud = $this->crearSolicitud($this->revisor, 'baja', null, null, $editor, $this->revisor);
        $this->app['auth']->forgetGuards();

        $this->actuarComo($this->admin)
            ->postJson("/api/panel/usuarios/{$editor}/desactivar", ['id_solicitud' => $idSolicitud])
            ->assertNoContent();

        $this->assertSame('inactivo', DB::table('usuario')->where('id_usuario', $editor)->value('estado'));
        $this->assertSame(0, DB::table('sessions')->where('user_id', $editor)->count());
        $this->assertSame(1, DB::table('bitacora_acceso')->where(['id_usuario' => $editor, 'accion' => 'baja', 'id_usuario_actor' => $this->admin])->count());
        $this->assertSame(1, DB::table('usuario')->where('id_usuario', $editor)->count(), 'La baja nunca elimina al usuario.');

        $this->app['auth']->forgetGuards();
        $this->withUnencryptedCookie((string) config('session.cookie'), $cookieSesion->getValue())
            ->getJson('/api/panel/auth/yo')
            ->assertUnauthorized();

        $this->actuarComo($editor)->getJson('/api/panel/auth/yo')
            ->assertUnauthorized()
            ->assertJsonPath('error.codigo', 'SESION_REVOCADA');
    }

    public function test_no_puede_darse_de_baja_a_si_mismo(): void
    {
        $otroAdmin = $this->crearUsuario('Administrador');
        $idSolicitud = $this->crearSolicitud($otroAdmin, 'baja', null, null, $this->admin, $this->revisor);

        $this->actuarComo($this->admin)
            ->postJson("/api/panel/usuarios/{$this->admin}/desactivar", ['id_solicitud' => $idSolicitud])
            ->assertStatus(409)
            ->assertJsonPath('error.mensaje', 'No puede darse de baja a sí mismo.');
    }

    public function test_no_se_quita_el_rol_al_ultimo_administrador(): void
    {
        $idSolicitud = $this->crearSolicitud($this->revisor, 'cambio_rol', $this->idRol('Editor'), null, $this->admin, $this->revisor);

        $this->actuarComo($this->admin)
            ->postJson("/api/panel/usuarios/{$this->admin}/cambiar-rol", ['id_solicitud' => $idSolicitud])
            ->assertStatus(409)
            ->assertJsonPath('error.mensaje', 'No se puede quitar el rol al último Administrador activo.');
    }

    public function test_cambio_de_rol_con_solicitud_autorizada(): void
    {
        $editor = $this->crearUsuario('Editor');
        $idSolicitud = $this->crearSolicitud($this->admin, 'cambio_rol', $this->idRol('Revisor'), null, $editor, $this->revisor);
        $otro = $this->crearUsuario('Editor');

        $this->actuarComo($this->admin)
            ->postJson("/api/panel/usuarios/{$otro}/cambiar-rol", ['id_solicitud' => $idSolicitud])
            ->assertStatus(409);

        $this->postJson("/api/panel/usuarios/{$editor}/cambiar-rol", ['id_solicitud' => $idSolicitud])->assertNoContent();

        $this->assertSame($this->idRol('Revisor'), DB::table('usuario')->where('id_usuario', $editor)->value('id_rol'));
        $this->assertSame(1, $this->contarBitacora($editor, 'cambio_rol'));
        $this->postJson("/api/panel/usuarios/{$editor}/cambiar-rol", ['id_solicitud' => $idSolicitud])->assertStatus(409);
    }

    public function test_listar_ver_y_editar_datos(): void
    {
        $editor = $this->crearUsuario('Editor', ['nombres' => 'Rosa', 'apellidos' => 'Quispe', 'cargo' => 'Secretaria de Dirección']);

        $this->actuarComo($this->revisor)
            ->getJson('/api/panel/usuarios?rol=Editor&q=quisp')
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.id_usuario', $editor)
            ->assertJsonPath('data.0.cargo', 'Secretaria de Dirección')
            ->assertJsonMissingPath('data.0.contrasena_hash');

        $this->getJson("/api/panel/usuarios/{$editor}")
            ->assertOk()
            ->assertJsonPath('data.nombres', 'Rosa')
            ->assertJsonPath('data.bitacora.0.accion', 'alta');

        $this->getJson('/api/panel/usuarios/999999')->assertNotFound()->assertJsonPath('error.codigo', 'NO_ENCONTRADO');

        $this->patchJson("/api/panel/usuarios/{$editor}", ['nombres' => 'Rosa María', 'apellidos' => 'Quispe', 'cargo' => null])->assertForbidden();

        $this->actuarComo($this->admin)
            ->patchJson("/api/panel/usuarios/{$editor}", ['nombres' => 'Rosa María', 'apellidos' => 'Quispe', 'cargo' => null])
            ->assertNoContent();

        $fila = DB::table('usuario')->where('id_usuario', $editor)->first();
        $this->assertSame('Rosa María', $fila->nombres);
        $this->assertNull($fila->cargo);
        $this->assertSame(1, $this->contarBitacora($editor, 'edicion_datos'));

        $this->patchJson("/api/panel/usuarios/{$editor}", ['nombres' => '', 'apellidos' => 'Q'])->assertUnprocessable()->assertJsonPath('error.codigo', 'VALIDACION');
    }

    public function test_matriz_de_permisos_por_rol(): void
    {
        $editor = $this->crearUsuario('Editor');

        $this->actuarComo($editor);
        $this->getJson('/api/panel/usuarios')->assertForbidden()->assertJsonPath('error.codigo', 'ROL_NO_AUTORIZADO');
        $this->getJson('/api/panel/bitacora')->assertForbidden();
        $this->postJson('/api/panel/usuarios', ['id_solicitud' => 1, 'nombres' => 'A', 'apellidos' => 'B'])->assertForbidden();
        $this->getJson('/api/panel/roles')->assertOk();

        $this->actuarComo($this->revisor);
        $this->postJson('/api/panel/usuarios', ['id_solicitud' => 1, 'nombres' => 'A', 'apellidos' => 'B'])->assertForbidden();
        $this->postJson("/api/panel/usuarios/{$editor}/desactivar", ['id_solicitud' => 1])->assertForbidden();
        $this->getJson('/api/panel/usuarios')->assertOk();

        $this->actuarComo($this->admin);
        $this->postJson('/api/panel/solicitudes/1/autorizar')->assertForbidden();
        $this->deleteJson("/api/panel/usuarios/{$editor}")->assertStatus(405);

        $this->app['auth']->forgetGuards();
        $this->getJson('/api/panel/usuarios')->assertUnauthorized()->assertJsonPath('error.codigo', 'NO_AUTENTICADO');
    }
}
