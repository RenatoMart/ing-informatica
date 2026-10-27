<?php

namespace Tests\Feature\Usuarios;

use App\Aplicacion\Usuarios\Correos\RecuperacionContrasenaMail;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Tests\Concerns\DatosUsuarios;
use Tests\TestCase;

/**
 * Recuperación por token de 60 minutos: 202 siempre, uso único, vencido → 422, solo se guarda el hash.
 */
class RecuperacionContrasenaTest extends TestCase
{
    use DatosUsuarios;

    protected function setUp(): void
    {
        parent::setUp();

        Mail::fake();
        $this->sembrarRoles();
    }

    public function test_correo_inexistente_responde_202_sin_enviar_nada(): void
    {
        $this->postJson('/api/panel/auth/recuperar', ['correo' => $this->correoPrueba('nadie')])->assertStatus(202);

        Mail::assertNothingQueued();
        $this->assertSame(0, DB::table('token_recuperacion')->count());
    }

    public function test_token_valido_se_usa_una_sola_vez_y_revoca_sesiones(): void
    {
        $correo = $this->correoPrueba('recupera');
        $id = $this->crearUsuario('Editor', ['correo' => $correo, 'debe_cambiar_contrasena' => true]);
        DB::table('sessions')->insert(['id' => 'sesion-abierta', 'user_id' => $id, 'payload' => 'x', 'last_activity' => time()]);

        $this->postJson('/api/panel/auth/recuperar', ['correo' => $correo])->assertStatus(202);

        $token = $this->tokenEnviado($correo);
        $this->assertSame(hash('sha256', $token), trim((string) DB::table('token_recuperacion')->where('id_usuario', $id)->value('token_hash')));
        $this->assertSame(0, DB::table('token_recuperacion')->where('token_hash', $token)->count());

        $this->postJson('/api/panel/auth/restablecer', [
            'correo' => $correo,
            'token' => $token,
            'contrasena_nueva' => 'Recuperada2026',
            'contrasena_nueva_confirmation' => 'Recuperada2026',
        ])->assertNoContent();

        $fila = DB::table('usuario')->where('id_usuario', $id)->first();
        $this->assertTrue(Hash::check('Recuperada2026', $fila->contrasena_hash));
        $this->assertFalse($fila->debe_cambiar_contrasena);
        $this->assertSame(0, DB::table('sessions')->where('user_id', $id)->count());
        $this->assertSame(2, $this->contarBitacora($id, 'recuperacion'));

        $this->postJson('/api/panel/auth/restablecer', [
            'correo' => $correo,
            'token' => $token,
            'contrasena_nueva' => 'OtraVezClave2026',
            'contrasena_nueva_confirmation' => 'OtraVezClave2026',
        ])->assertUnprocessable()
            ->assertJsonPath('error.codigo', 'REGLA_NEGOCIO')
            ->assertJsonPath('error.campos.token.0', 'Enlace inválido o vencido');

        $this->postJson('/api/panel/auth/login', ['correo' => $correo, 'contrasena' => 'Recuperada2026'])->assertOk();
    }

    public function test_token_vencido_da_422(): void
    {
        $correo = $this->correoPrueba('vencido');
        $id = $this->crearUsuario('Editor', ['correo' => $correo]);

        $this->postJson('/api/panel/auth/recuperar', ['correo' => $correo])->assertStatus(202);
        $token = $this->tokenEnviado($correo);
        DB::table('token_recuperacion')->where('id_usuario', $id)->update(['fecha_expira' => DB::raw("now() - interval '1 minute'")]);

        $this->postJson('/api/panel/auth/restablecer', [
            'correo' => $correo,
            'token' => $token,
            'contrasena_nueva' => 'Recuperada2026',
            'contrasena_nueva_confirmation' => 'Recuperada2026',
        ])->assertUnprocessable()->assertJsonPath('error.campos.token.0', 'Enlace inválido o vencido');

        $this->assertTrue(Hash::check(self::CONTRASENA_PRUEBA, (string) DB::table('usuario')->where('id_usuario', $id)->value('contrasena_hash')));
    }

    public function test_token_con_formato_invalido_y_politica_de_contrasena(): void
    {
        $correo = $this->correoPrueba('formato');
        $this->crearUsuario('Editor', ['correo' => $correo]);

        $this->postJson('/api/panel/auth/restablecer', [
            'correo' => $correo,
            'token' => 'no-es-un-token',
            'contrasena_nueva' => 'Recuperada2026',
            'contrasena_nueva_confirmation' => 'Recuperada2026',
        ])->assertUnprocessable()->assertJsonPath('error.campos.token.0', 'Enlace inválido o vencido.');

        $this->postJson('/api/panel/auth/restablecer', [
            'correo' => $correo,
            'token' => str_repeat('a', 64),
            'contrasena_nueva' => '1234567890',
            'contrasena_nueva_confirmation' => '1234567890',
        ])->assertUnprocessable()->assertJsonStructure(['error' => ['campos' => ['contrasena_nueva']]]);
    }

    public function test_cuarta_solicitud_por_hora_da_429(): void
    {
        for ($i = 0; $i < 3; $i++) {
            $this->postJson('/api/panel/auth/recuperar', ['correo' => $this->correoPrueba('x'.$i)])->assertStatus(202);
        }

        $this->postJson('/api/panel/auth/recuperar', ['correo' => $this->correoPrueba('x9')])
            ->assertTooManyRequests()
            ->assertJsonPath('error.codigo', 'DEMASIADOS_INTENTOS');
    }

    private function tokenEnviado(string $correo): string
    {
        $token = null;

        Mail::assertQueued(RecuperacionContrasenaMail::class, function (RecuperacionContrasenaMail $correoEnviado) use ($correo, &$token): bool {
            parse_str((string) parse_url($correoEnviado->enlace, PHP_URL_QUERY), $parametros);
            $token = $parametros['token'] ?? null;

            return $correoEnviado->hasTo($correo) && ($parametros['correo'] ?? null) === $correo && $correoEnviado->minutosVigencia === 60;
        });

        $this->assertIsString($token);
        $this->assertMatchesRegularExpression('/^[0-9a-f]{64}$/', $token);

        return $token;
    }
}
