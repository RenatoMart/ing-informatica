<?php

namespace Tests\Feature\DocumentosAdmision;

use App\Aplicacion\Compartido\Correos\ContenidoEnRevisionMail;
use App\Aplicacion\DocumentosAdmision\AdmisionServicio;
use App\Dominio\Compartido\Excepciones\TransicionInvalidaException;
use App\Dominio\Revision\TipoDecision;
use App\Persistencia\Compartido\EjecutorProcedimientos;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Tests\Concerns\DatosDocumentosAdmision;
use Tests\TestCase;

/**
 * Panel de campañas de admisión: CRUD, validaciones, enlaces, revisión y campaña vigente única.
 */
class CampanasPanelTest extends TestCase
{
    use DatosDocumentosAdmision;

    private int $editor;

    private int $revisor;

    protected function setUp(): void
    {
        parent::setUp();

        Mail::fake();
        $this->asegurarRoles();

        $this->editor = $this->crearUsuario('Editor');
        $this->revisor = $this->crearUsuario('Revisor');
        $this->actuarComo($this->editor, 'Editor');
    }

    public function test_crear_campana_con_modalidad_e_hito_y_ver_el_detalle(): void
    {
        $id = $this->postJson('/api/panel/campanas', $this->datosCampana())->assertCreated()->json('data.id');

        $this->postJson("/api/panel/campanas/{$id}/modalidades", ['nombre' => 'Ordinario', 'dirigido_a' => 'Egresados', 'vacantes' => 25])->assertCreated();
        $this->postJson("/api/panel/campanas/{$id}/hitos", ['hito' => 'Inscripciones', 'fecha' => now()->addDays(5)->toDateString()])->assertCreated();

        $this->getJson("/api/panel/campanas/{$id}")
            ->assertOk()
            ->assertJsonPath('data.estado', 'borrador')
            ->assertJsonCount(1, 'data.modalidades')
            ->assertJsonCount(1, 'data.cronograma');
        $this->getJson('/api/panel/campanas')->assertOk()->assertJsonPath('data.0.id_campana', $id);
    }

    public function test_valida_fechas_en_orden_y_urls_https(): void
    {
        $this->postJson('/api/panel/campanas', $this->datosCampana(['fecha_fin' => now()->subDay()->toDateString()]))
            ->assertStatus(422)->assertJsonPath('error.codigo', 'VALIDACION');
        $this->postJson('/api/panel/campanas', $this->datosCampana(['url_portal' => 'http://inseguro.test']))->assertStatus(422);
        $this->assertSame(0, DB::table('campana_admision')->count());
    }

    public function test_vacantes_deben_ser_mayores_que_cero(): void
    {
        $id = $this->crearCampanaBorrador($this->editor);

        $this->postJson("/api/panel/campanas/{$id}/modalidades", ['nombre' => 'Cero', 'vacantes' => 0])->assertStatus(422);
        $this->postJson("/api/panel/campanas/{$id}/modalidades", ['nombre' => 'Negativa', 'vacantes' => -3])->assertStatus(422);
        $this->assertSame(1, DB::table('modalidad_admision')->where('id_campana', $id)->count());
    }

    public function test_el_hito_debe_caer_dentro_del_periodo(): void
    {
        $id = $this->crearCampanaBorrador($this->editor);

        $this->postJson("/api/panel/campanas/{$id}/hitos", ['hito' => 'Muy tarde', 'fecha' => now()->addDays(200)->toDateString()])
            ->assertStatus(422)->assertJsonPath('error.campos.fecha.0', fn ($mensaje) => is_string($mensaje));
    }

    public function test_actualizar_y_eliminar_modalidades_e_hitos(): void
    {
        $id = $this->crearCampanaBorrador($this->editor);
        $modalidad = DB::table('modalidad_admision')->where('id_campana', $id)->value('id_modalidad');
        $hito = DB::table('cronograma_admision')->where('id_campana', $id)->value('id_hito');

        $this->putJson("/api/panel/modalidades/{$modalidad}", ['nombre' => 'Renombrada', 'vacantes' => 40])->assertNoContent();
        $this->assertSame(40, DB::table('modalidad_admision')->where('id_modalidad', $modalidad)->value('vacantes'));
        $this->putJson("/api/panel/hitos/{$hito}", ['hito' => 'Examen', 'fecha' => now()->addDays(10)->toDateString()])->assertNoContent();
        $this->deleteJson("/api/panel/hitos/{$hito}")->assertNoContent();
        $this->deleteJson("/api/panel/modalidades/{$modalidad}")->assertNoContent();
        $this->deleteJson('/api/panel/modalidades/99999999')->assertStatus(404);
    }

    public function test_validacion_lista_los_errores_de_una_campana_incompleta(): void
    {
        $id = $this->postJson('/api/panel/campanas', ['anio' => (int) now()->format('Y') + 2, 'proceso' => 'II'])->json('data.id');

        $codigos = collect($this->getJson("/api/panel/campanas/{$id}/validacion")->assertOk()->json('data'))->pluck('codigo');

        $this->assertTrue($codigos->contains('FECHAS_FALTANTES'));
        $this->assertTrue($codigos->contains('SIN_MODALIDADES'));
        $this->assertTrue($codigos->contains('URL_PORTAL'));
    }

    public function test_enlace_caido_impide_enviar_a_revision(): void
    {
        $id = $this->crearCampanaBorrador($this->editor);
        Http::fake(['*' => Http::response('', 500)]);

        $this->postJson("/api/panel/campanas/{$id}/enviar-revision")
            ->assertStatus(422)->assertJsonPath('error.codigo', 'REGLA_NEGOCIO')->assertJsonPath('error.campos.url_portal.0', 'Hay enlaces no operativos');
        Mail::assertNothingSent();
    }

    public function test_enlaces_operativos_envian_a_revision_y_avisan_al_revisor(): void
    {
        $id = $this->crearCampanaBorrador($this->editor);
        Http::fake(['*' => Http::response('', 200)]);

        $this->postJson("/api/panel/campanas/{$id}/verificar-enlaces")
            ->assertOk()->assertJsonPath('data.url_portal.ok', true)->assertJsonPath('data.url_estadisticas.estado_http', 200);
        $this->postJson("/api/panel/campanas/{$id}/enviar-revision")->assertNoContent();

        $this->assertSame('en_revision', DB::table('campana_admision')->where('id_campana', $id)->value('estado'));
        Mail::assertSent(ContenidoEnRevisionMail::class);

        // En revisión ya no se edita (409) ni se reenvía.
        $this->putJson("/api/panel/campanas/{$id}", $this->datosCampana())->assertStatus(409);
        $this->postJson("/api/panel/campanas/{$id}/enviar-revision")->assertStatus(409);
        $this->postJson("/api/panel/campanas/{$id}/modalidades", ['nombre' => 'X', 'vacantes' => 5])->assertStatus(409);
    }

    public function test_enviar_sin_modalidades_da_422(): void
    {
        $id = $this->postJson('/api/panel/campanas', $this->datosCampana())->json('data.id');
        Http::fake(['*' => Http::response('', 200)]);

        $this->postJson("/api/panel/campanas/{$id}/enviar-revision")->assertStatus(422);
    }

    public function test_aprobar_la_nueva_archiva_la_anterior_y_solo_una_queda_vigente(): void
    {
        $primera = $this->crearCampanaAprobada($this->editor, $this->revisor, ['proceso' => 'I']);
        $segunda = $this->crearCampanaBorrador($this->editor, ['proceso' => 'II']);
        app(EjecutorProcedimientos::class)->ejecutar('sp_campana_enviar_revision', [$this->editor, $segunda, true]);

        $this->assertSame('vigente', app(AdmisionServicio::class)->decidir($this->revisor, $segunda, TipoDecision::Aprobar));

        $this->assertSame('archivada', DB::table('campana_admision')->where('id_campana', $primera)->value('estado'));
        $this->assertSame(1, DB::table('campana_admision')->where('estado', 'vigente')->count());
        $this->getJson('/api/publico/admision')->assertOk()->assertJsonPath('data.campana.proceso', 'II');
    }

    public function test_el_indice_unico_impide_dos_vigentes(): void
    {
        $this->crearCampanaAprobada($this->editor, $this->revisor);
        $otra = $this->crearCampanaBorrador($this->editor, ['proceso' => 'X']);

        $this->expectException(QueryException::class);
        DB::table('campana_admision')->where('id_campana', $otra)->update(['estado' => 'vigente']);
    }

    public function test_descartar_una_campana_es_409(): void
    {
        $id = $this->crearCampanaBorrador($this->editor);
        app(EjecutorProcedimientos::class)->ejecutar('sp_campana_enviar_revision', [$this->editor, $id, true]);

        $this->expectException(TransicionInvalidaException::class);
        app(AdmisionServicio::class)->decidir($this->revisor, $id, TipoDecision::Descartar, 'No corresponde');
    }

    public function test_observar_devuelve_a_borrador(): void
    {
        $id = $this->crearCampanaBorrador($this->editor);
        app(EjecutorProcedimientos::class)->ejecutar('sp_campana_enviar_revision', [$this->editor, $id, true]);

        $this->assertSame('borrador', app(AdmisionServicio::class)->decidir($this->revisor, $id, TipoDecision::Observar, 'Corrija el cronograma'));
    }

    public function test_duplicar_la_vigente_crea_un_borrador_con_modalidades_e_hitos(): void
    {
        $vigente = $this->crearCampanaAprobada($this->editor, $this->revisor);

        $copia = $this->postJson("/api/panel/campanas/{$vigente}/duplicar")->assertCreated()->json('data.id');

        $this->assertNotSame($vigente, $copia);
        $this->getJson("/api/panel/campanas/{$copia}")
            ->assertJsonPath('data.estado', 'borrador')
            ->assertJsonCount(1, 'data.modalidades')
            ->assertJsonCount(1, 'data.cronograma');
    }

    public function test_campana_inexistente_es_404(): void
    {
        $this->getJson('/api/panel/campanas/99999999')->assertStatus(404)->assertJsonPath('error.codigo', 'NO_ENCONTRADO');
    }
}
