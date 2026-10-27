<?php

namespace Tests\Feature\BaseDatos;

use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * Pruebas SQL de 10_sp_comunes.sql y 11_sp_usuarios.sql (paquete B2a).
 * Requieren PostgreSQL (schema pruebas); cada prueba corre en la transacción revertida de RefreshDatabase (tests/TestCase.php).
 */
class FuncionesComunesTest extends TestCase
{
    private const HASH = '$2y$04$abcdefghijklmnopqrstuuJ0123456789abcdefghijklmnopqrstu';

    protected function setUp(): void
    {
        parent::setUp();

        if (DB::connection()->getDriverName() !== 'pgsql') {
            $this->markTestSkipped('Requiere la conexión pgsql (schema pruebas).');
        }

        DB::statement("INSERT INTO rol (nombre, descripcion) VALUES ('Editor', 'E'), ('Revisor', 'R'), ('Administrador', 'A') ON CONFLICT (nombre) DO NOTHING");
    }

    /**
     * @return array<string, array{string, ?string, ?string, string, string}>
     */
    public static function transicionesValidas(): array
    {
        return [
            'publicacion enviar' => ['publicacion', 'borrador', null, 'enviar_revision', 'en_revision'],
            'publicacion nueva' => ['publicacion', null, null, 'guardar', 'borrador'],
            'publicacion aprobar baja' => ['publicacion', 'publicada', 'baja', 'aprobar', 'despublicada'],
            'publicacion observar cambio' => ['publicacion', 'publicada', 'cambio', 'observar', 'publicada'],
            'docente baja' => ['docente', 'publicado', 'baja', 'aprobar', 'inactivo'],
            'docente reactivar' => ['docente', 'inactivo', null, 'reactivar', 'borrador'],
            'plan aprobar' => ['plan', 'en_revision', null, 'aprobar', 'vigente'],
            'documento observar' => ['documento', 'en_revision', null, 'observar', 'no_publicado'],
            'documento vencer' => ['documento', 'vigente', null, 'vencer', 'vencido'],
            'campana cerrar' => ['campana', 'vigente', null, 'cerrar', 'cerrada'],
        ];
    }

    #[DataProvider('transicionesValidas')]
    public function test_transicion_valida(string $entidad, ?string $estado, ?string $operacion, string $accion, string $esperado): void
    {
        $resultado = DB::selectOne('select sp_rev_transicion(?, ?, ?, ?) as r', [$entidad, $estado, $operacion, $accion])->r;

        $this->assertSame($esperado, $resultado);
    }

    /**
     * @return array<string, array{string, ?string, ?string, string}>
     */
    public static function transicionesInvalidas(): array
    {
        return [
            'publicacion aprobar borrador' => ['publicacion', 'borrador', null, 'aprobar'],
            'publicacion baja sobre cambio' => ['publicacion', 'publicada', 'cambio', 'solicitar_baja'],
            'docente descartar' => ['docente', 'en_revision', null, 'descartar'],
            'campana descartar' => ['campana', 'en_revision', null, 'descartar'],
            'documento reenviar vigente' => ['documento', 'vigente', null, 'reenviar'],
        ];
    }

    #[DataProvider('transicionesInvalidas')]
    public function test_transicion_invalida_lanza_rn409(string $entidad, ?string $estado, ?string $operacion, string $accion): void
    {
        $this->assertSqlState('RN409', fn () => DB::select('select sp_rev_transicion(?, ?, ?, ?)', [$entidad, $estado, $operacion, $accion]));
    }

    public function test_validar_decision_rechaza_revisor_igual_al_editor_y_observaciones_cortas(): void
    {
        $this->assertSqlState('RN403', fn () => DB::select('select sp_rev_validar_decision(5, null, 5, ?, null)', ['aprobar']));
        $this->assertSqlState('RN403', fn () => DB::select('select sp_rev_validar_decision(4, 5, 5, ?, null)', ['aprobar']));
        $this->assertSqlState('RN422', fn () => DB::select('select sp_rev_validar_decision(4, null, 5, ?, ?)', ['observar', 'no']));
        $this->assertSqlState('RN422', fn () => DB::select('select sp_rev_validar_decision(4, null, 5, ?, null)', ['publicar']));

        DB::select('select sp_rev_validar_decision(4, null, 5, ?, ?)', ['observar', 'Falta la imagen']);
        $this->assertTrue(true);
    }

    public function test_dias_habiles_no_cuenta_dia_inicial_ni_fin_de_semana(): void
    {
        $dias = DB::selectOne("select sp_dias_habiles('2026-10-30 10:00'::timestamptz, '2026-11-03 10:00'::timestamptz) as d")->d;

        $this->assertSame(2, $dias);
    }

    public function test_historial_y_bandeja_de_pendientes(): void
    {
        $editor = $this->crearUsuarioSql('Editor', 'editor.b2a@test.local');
        $id = DB::selectOne("INSERT INTO publicacion (titulo, estado, id_editor) VALUES ('Noticia B2a', 'en_revision', ?) RETURNING id_publicacion", [$editor])->id_publicacion;

        DB::select('select sp_rev_registrar_historial(?, ?, ?, ?, ?, ?, ?)', ['publicacion', $id, 'enviar_revision', 'borrador', 'en_revision', $editor, null]);

        $this->assertSame(1, DB::table('historial_revision')->where('entidad', 'publicacion')->where('id_registro', $id)->count());
        $fila = DB::table('v_rev_pendientes')->where('entidad', 'publicacion')->where('id_registro', $id)->first();
        $this->assertSame('revision', $fila->operacion);
        $this->assertSame($editor, $fila->id_editor);
    }

    public function test_flujo_alta_autorizar_crear_usuario_y_bitacora(): void
    {
        $admin = $this->crearUsuarioSql('Administrador', 'admin.b2a@test.local');
        $revisor = $this->crearUsuarioSql('Revisor', 'revisor.b2a@test.local');
        $idEditor = DB::table('rol')->where('nombre', 'Editor')->value('id_rol');

        $solicitud = DB::selectOne('select sp_solicitud_registrar(?, ?, ?, ?, ?, ?, ?) as id', [$admin, 'Ana Secretaria', 'alta', $idEditor, 'Ingreso', 'Ana@Test.local', null])->id;

        $this->assertSqlState('RN409', fn () => DB::select('select sp_solicitud_registrar(?, ?, ?, ?, ?, ?, ?)', [$admin, 'Ana', 'alta', $idEditor, null, 'ana@test.local', null]));
        $this->assertSqlState('RN409', fn () => DB::select('select sp_usuario_crear(?, ?, ?, ?, ?, ?, ?)', [$admin, $solicitud, 'Ana', 'Ruiz', 'ana@test.local', self::HASH, null]));
        $this->assertSqlState('RN403', fn () => DB::select('select sp_solicitud_resolver(?, ?, true, null)', [$admin, $solicitud]));

        DB::select('select sp_solicitud_resolver(?, ?, true, ?)', [$revisor, $solicitud, 'Conforme']);
        $nuevo = DB::selectOne('select sp_usuario_crear(?, ?, ?, ?, ?, ?, ?) as id', [$admin, $solicitud, 'Ana', 'Ruiz', 'ana@test.local', self::HASH, 'Secretaria de Dirección'])->id;

        $usuario = DB::table('usuario')->where('id_usuario', $nuevo)->first();
        $this->assertTrue($usuario->debe_cambiar_contrasena);
        $this->assertSame($idEditor, $usuario->id_rol);
        $this->assertNotNull(DB::table('solicitud_acceso')->where('id_solicitud', $solicitud)->value('fecha_ejecucion'));
        $this->assertSame(1, DB::table('bitacora_acceso')->where(['id_usuario' => $nuevo, 'accion' => 'alta', 'id_usuario_actor' => $admin])->count());
        $this->assertSqlState('RN409', fn () => DB::select('select sp_usuario_crear(?, ?, ?, ?, ?, ?, ?)', [$admin, $solicitud, 'Ana', 'Ruiz', 'ana@test.local', self::HASH, null]));
    }

    public function test_solicitud_denegada_registra_bitacora(): void
    {
        $admin = $this->crearUsuarioSql('Administrador', 'admin.b2a@test.local');
        $revisor = $this->crearUsuarioSql('Revisor', 'revisor.b2a@test.local');
        $idEditor = DB::table('rol')->where('nombre', 'Editor')->value('id_rol');
        $solicitud = DB::selectOne('select sp_solicitud_registrar(?, ?, ?, ?, ?, ?, ?) as id', [$admin, 'Luis', 'alta', $idEditor, null, 'luis@test.local', null])->id;

        DB::select('select sp_solicitud_resolver(?, ?, false, ?)', [$revisor, $solicitud, 'No corresponde']);

        $this->assertSame(1, DB::table('bitacora_acceso')->where(['id_usuario' => $revisor, 'accion' => 'denegado'])->count());
        $this->assertSqlState('RN409', fn () => DB::select('select sp_solicitud_resolver(?, ?, true, null)', [$revisor, $solicitud]));
    }

    public function test_baja_desactiva_revoca_sesiones_y_tokens(): void
    {
        $admin = $this->crearUsuarioSql('Administrador', 'admin.b2a@test.local');
        $revisor = $this->crearUsuarioSql('Revisor', 'revisor.b2a@test.local');
        $editor = $this->crearUsuarioSql('Editor', 'editor.b2a@test.local');
        DB::table('sessions')->insert(['id' => 'sesion-b2a', 'user_id' => $editor, 'payload' => 'x', 'last_activity' => time()]);
        DB::select('select sp_token_recuperacion_crear(?, ?, 60, null)', ['editor.b2a@test.local', str_repeat('a', 64)]);

        $solicitud = DB::selectOne('select sp_solicitud_registrar(?, ?, ?, null, null, null, ?) as id', [$revisor, 'Editor saliente', 'baja', $editor])->id;
        DB::select('select sp_solicitud_resolver(?, ?, true, null)', [$revisor, $solicitud]);
        DB::select('select sp_usuario_desactivar(?, ?, ?)', [$admin, $solicitud, '10.0.0.1']);

        $this->assertSame('inactivo', DB::table('usuario')->where('id_usuario', $editor)->value('estado'));
        $this->assertSame(0, DB::table('sessions')->where('user_id', $editor)->count());
        $this->assertSame(0, DB::table('token_recuperacion')->where('id_usuario', $editor)->whereNull('fecha_uso')->count());
        $this->assertSame(1, DB::table('bitacora_acceso')->where(['id_usuario' => $editor, 'accion' => 'baja', 'ip' => '10.0.0.1'])->count());
        $this->assertSqlState('RN403', fn () => DB::select('select sp_rev_assert_rol(?, ?)', [$editor, '{Editor}']));
    }

    public function test_no_se_puede_dar_de_baja_a_si_mismo(): void
    {
        $admin = $this->crearUsuarioSql('Administrador', 'admin.b2a@test.local');
        $revisor = $this->crearUsuarioSql('Revisor', 'revisor.b2a@test.local');
        $solicitud = DB::selectOne('select sp_solicitud_registrar(?, ?, ?, null, null, null, ?) as id', [$revisor, 'Admin', 'baja', $admin])->id;
        DB::select('select sp_solicitud_resolver(?, ?, true, null)', [$revisor, $solicitud]);

        $this->assertSqlState('RN409', fn () => DB::select('select sp_usuario_desactivar(?, ?, null)', [$admin, $solicitud]));
    }

    public function test_recuperacion_con_token_vencido_y_valido(): void
    {
        $editor = $this->crearUsuarioSql('Editor', 'editor.b2a@test.local');

        $this->assertNull(DB::selectOne('select sp_token_recuperacion_crear(?, ?, 60, null) as id', ['nadie@test.local', str_repeat('b', 64)])->id);

        DB::select('select sp_token_recuperacion_crear(?, ?, 60, null)', ['editor.b2a@test.local', str_repeat('c', 64)]);
        DB::table('token_recuperacion')->where('token_hash', str_repeat('c', 64))->update(['fecha_expira' => DB::raw("now() - interval '1 minute'")]);
        $this->assertSqlState('RN422', fn () => DB::select('select sp_token_recuperacion_consumir(?, ?, ?, null)', ['editor.b2a@test.local', str_repeat('c', 64), self::HASH]));

        DB::select('select sp_token_recuperacion_crear(?, ?, 60, null)', ['Editor.B2a@test.local', str_repeat('d', 64)]);
        DB::table('sessions')->insert(['id' => 'sesion-b2a', 'user_id' => $editor, 'payload' => 'x', 'last_activity' => time()]);
        $id = DB::selectOne('select sp_token_recuperacion_consumir(?, ?, ?, ?) as id', ['editor.b2a@test.local', str_repeat('d', 64), self::HASH, '10.0.0.2'])->id;

        $this->assertSame($editor, $id);
        $this->assertFalse(DB::table('usuario')->where('id_usuario', $editor)->value('debe_cambiar_contrasena'));
        $this->assertSame(0, DB::table('sessions')->where('user_id', $editor)->count());
        $this->assertSqlState('RN422', fn () => DB::select('select sp_token_recuperacion_consumir(?, ?, ?, null)', ['editor.b2a@test.local', str_repeat('d', 64), self::HASH]));
    }

    private function crearUsuarioSql(string $rol, string $correo): int
    {
        return DB::selectOne('select sp_usuario_crear_inicial(?, ?, ?, ?, ?, null) as id', ['Nombre', 'Apellido', $correo, self::HASH, $rol])->id;
    }

    private function assertSqlState(string $esperado, callable $accion): void
    {
        DB::statement('SAVEPOINT b2a_error');

        try {
            $accion();
            $this->fail("Se esperaba el SQLSTATE {$esperado}.");
        } catch (QueryException $e) {
            DB::statement('ROLLBACK TO SAVEPOINT b2a_error');
            $this->assertSame($esperado, $e->errorInfo[0] ?? null, $e->getMessage());
        }
    }
}
