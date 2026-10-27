<?php

namespace Tests\Feature\Usuarios;

use App\Aplicacion\Usuarios\Correos\CredencialesTemporalesMail;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Mail;
use Tests\Concerns\DatosUsuarios;
use Tests\TestCase;

/**
 * P5: solicitud → autorización del Revisor → ejecución del Administrador.
 */
class SolicitudesAccesoTest extends TestCase
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

    public function test_alta_completa_solicitud_autorizar_ejecutar_y_correo(): void
    {
        $correoNuevo = $this->correoPrueba('nueva.secretaria');

        $idSolicitud = $this->actuarComo($this->admin)->postJson('/api/panel/solicitudes', [
            'solicitante_nombre' => 'Ana Ruiz',
            'tipo_solicitud' => 'alta',
            'id_rol_solicitado' => $this->idRol('Editor'),
            'motivo' => 'Nueva secretaria',
            'correo_solicitado' => strtoupper($correoNuevo),
        ])->assertCreated()->json('data.id_solicitud');

        $this->postJson('/api/panel/usuarios', ['id_solicitud' => $idSolicitud, 'nombres' => 'Ana', 'apellidos' => 'Ruiz'])
            ->assertStatus(409)
            ->assertJsonPath('error.codigo', 'ESTADO_INVALIDO');

        $this->postJson("/api/panel/solicitudes/{$idSolicitud}/autorizar")->assertForbidden();

        $this->actuarComo($this->revisor)->postJson("/api/panel/solicitudes/{$idSolicitud}/autorizar", ['observacion' => 'Conforme'])->assertNoContent();
        $this->postJson("/api/panel/solicitudes/{$idSolicitud}/autorizar")->assertStatus(409);
        $this->postJson('/api/panel/usuarios', ['id_solicitud' => $idSolicitud, 'nombres' => 'Ana', 'apellidos' => 'Ruiz'])->assertForbidden();

        $idUsuario = $this->actuarComo($this->admin)->postJson('/api/panel/usuarios', [
            'id_solicitud' => $idSolicitud,
            'nombres' => 'Ana',
            'apellidos' => 'Ruiz',
            'cargo' => 'Secretaria de Dirección',
        ])->assertCreated()->json('data.id_usuario');

        $usuario = DB::table('usuario')->where('id_usuario', $idUsuario)->first();
        $this->assertSame($correoNuevo, $usuario->correo_institucional);
        $this->assertSame($this->idRol('Editor'), $usuario->id_rol);
        $this->assertTrue($usuario->debe_cambiar_contrasena);
        $this->assertSame(1, DB::table('bitacora_acceso')->where(['id_usuario' => $idUsuario, 'accion' => 'alta', 'id_usuario_actor' => $this->admin])->count());

        $temporal = null;
        Mail::assertQueued(CredencialesTemporalesMail::class, function (CredencialesTemporalesMail $correo) use ($correoNuevo, &$temporal): bool {
            $temporal = $correo->contrasenaTemporal;

            return $correo->hasTo($correoNuevo) && $correo->correo === $correoNuevo;
        });
        $this->assertMatchesRegularExpression('/^[A-HJ-NP-Za-km-z2-9]{12}$/', (string) $temporal);
        $this->assertStringNotContainsString((string) $temporal, (string) $usuario->contrasena_hash);

        $this->postJson('/api/panel/usuarios', ['id_solicitud' => $idSolicitud, 'nombres' => 'Ana', 'apellidos' => 'Ruiz'])
            ->assertStatus(409)
            ->assertJsonPath('error.codigo', 'ESTADO_INVALIDO');

        $this->app['auth']->forgetGuards();
        $this->postJson('/api/panel/auth/login', ['correo' => $correoNuevo, 'contrasena' => $temporal])
            ->assertOk()
            ->assertJsonPath('data.usuario.debe_cambiar_contrasena', true);
    }

    public function test_alta_envia_el_correo_al_log_con_mail_mailer_log(): void
    {
        $archivo = storage_path('logs/correos-prueba-b4.log');
        File::delete($archivo);
        Mail::swap(app('mail.manager'));
        config([
            'logging.channels.correos_prueba' => ['driver' => 'single', 'path' => $archivo],
            'mail.default' => 'log',
            'mail.mailers.log' => ['transport' => 'log', 'channel' => 'correos_prueba'],
        ]);

        $correoNuevo = $this->correoPrueba('log.correo');
        $idSolicitud = $this->crearSolicitud($this->admin, 'alta', $this->idRol('Revisor'), $correoNuevo, null, $this->revisor);

        $this->actuarComo($this->admin)
            ->postJson('/api/panel/usuarios', ['id_solicitud' => $idSolicitud, 'nombres' => 'Luis', 'apellidos' => 'Paz'])
            ->assertCreated();

        $contenido = File::get($archivo);
        $this->assertStringContainsString($correoNuevo, $contenido);
        $this->assertStringContainsString('Contrase', $contenido);
        File::delete($archivo);
    }

    public function test_denegar_exige_observacion_y_registra_bitacora(): void
    {
        $idSolicitud = $this->crearSolicitud($this->admin, 'alta', $this->idRol('Editor'), $this->correoPrueba('denegada'));

        $this->actuarComo($this->revisor)
            ->postJson("/api/panel/solicitudes/{$idSolicitud}/denegar", [])
            ->assertUnprocessable()
            ->assertJsonPath('error.codigo', 'VALIDACION');

        $this->postJson("/api/panel/solicitudes/{$idSolicitud}/denegar", ['observacion' => 'No corresponde'])->assertNoContent();

        $this->assertSame('denegada', DB::table('solicitud_acceso')->where('id_solicitud', $idSolicitud)->value('estado'));
        $this->assertSame(1, $this->contarBitacora($this->revisor, 'denegado'));
    }

    public function test_registro_valida_por_tipo_dominio_y_duplicados(): void
    {
        $this->actuarComo($this->revisor);

        $this->postJson('/api/panel/solicitudes', ['solicitante_nombre' => 'X', 'tipo_solicitud' => 'alta', 'id_rol_solicitado' => $this->idRol('Editor')])
            ->assertUnprocessable()
            ->assertJsonStructure(['error' => ['campos' => ['correo_solicitado']]]);

        $this->postJson('/api/panel/solicitudes', ['solicitante_nombre' => 'X', 'tipo_solicitud' => 'baja'])
            ->assertUnprocessable()
            ->assertJsonStructure(['error' => ['campos' => ['id_usuario_objetivo']]]);

        $this->postJson('/api/panel/solicitudes', [
            'solicitante_nombre' => 'X', 'tipo_solicitud' => 'alta', 'id_rol_solicitado' => $this->idRol('Editor'), 'correo_solicitado' => 'alguien@gmail.com',
        ])->assertUnprocessable()->assertJsonPath('error.codigo', 'REGLA_NEGOCIO');

        $this->postJson('/api/panel/solicitudes', [
            'solicitante_nombre' => 'X', 'tipo_solicitud' => 'alta', 'id_rol_solicitado' => $this->idRol('Editor'), 'correo_solicitado' => $this->correoPrueba('admin'),
        ])->assertStatus(409)->assertJsonPath('error.codigo', 'DUPLICADO');

        $datos = ['solicitante_nombre' => 'X', 'tipo_solicitud' => 'alta', 'id_rol_solicitado' => $this->idRol('Editor'), 'correo_solicitado' => $this->correoPrueba('doble')];
        $this->postJson('/api/panel/solicitudes', $datos)->assertCreated();
        $this->postJson('/api/panel/solicitudes', $datos)->assertStatus(409)->assertJsonPath('error.codigo', 'ESTADO_INVALIDO');
    }

    public function test_listado_paginado_con_filtros(): void
    {
        $this->crearSolicitud($this->admin, 'alta', $this->idRol('Editor'), $this->correoPrueba('uno'));
        $this->crearSolicitud($this->admin, 'alta', $this->idRol('Editor'), $this->correoPrueba('dos'), null, $this->revisor);

        $this->actuarComo($this->admin)
            ->getJson('/api/panel/solicitudes?estado=autorizada&por_pagina=10')
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('meta.por_pagina', 10)
            ->assertJsonPath('data.0.estado', 'autorizada')
            ->assertJsonPath('data.0.ejecutada', false);
    }

    public function test_editor_no_puede_registrar_ni_ver_solicitudes(): void
    {
        $editor = $this->crearUsuario('Editor');

        $this->actuarComo($editor)->getJson('/api/panel/solicitudes')->assertForbidden()->assertJsonPath('error.codigo', 'ROL_NO_AUTORIZADO');
        $this->postJson('/api/panel/solicitudes', ['solicitante_nombre' => 'X', 'tipo_solicitud' => 'baja', 'id_usuario_objetivo' => $editor])->assertForbidden();
    }
}
