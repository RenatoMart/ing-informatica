<?php

namespace Tests\Feature\PlanEstudios;

use App\Aplicacion\PlanEstudios\PlanEstudiosServicio;
use App\Dominio\Compartido\Excepciones\AccesoDenegadoException;
use App\Dominio\Revision\TipoDecision;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Tests\Concerns\DatosPlanEstudios;
use Tests\TestCase;

/**
 * HU4: plan de estudios, cursos, prerrequisitos y lectura pública (BD real, schema `pruebas`).
 */
class PlanEstudiosApiTest extends TestCase
{
    use DatosPlanEstudios;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');
        Mail::fake();
        DB::statement("INSERT INTO rol (nombre, descripcion) VALUES ('Editor', 'E'), ('Revisor', 'R'), ('Administrador', 'A') ON CONFLICT (nombre) DO NOTHING");
    }

    /** @return array<string, mixed> */
    private function datosCurso(string $codigo, array $extra = []): array
    {
        return [...[
            'codigo' => $codigo, 'nombre' => "Curso {$codigo}", 'creditos' => 4, 'tipo' => 'obligatorio', 'ciclo' => 1,
            'area_formacion' => 'general', 'horas_teoria' => 2, 'horas_practica' => 2, 'descripcion' => 'Texto',
        ], ...$extra];
    }

    public function test_crud_de_plan_y_duplicado_de_version(): void
    {
        $this->iniciarSesionPlan('Editor');

        $id = $this->postJson('/api/panel/planes', ['anio' => 2030, 'version' => 'A'])
            ->assertCreated()->json('data.id_plan');

        $this->postJson('/api/panel/planes', ['anio' => 2030, 'version' => 'A'])
            ->assertStatus(409)->assertJsonPath('error.codigo', 'DUPLICADO');

        $this->postJson('/api/panel/planes', ['anio' => 1999, 'version' => 'A'])->assertStatus(422);

        $this->putJson("/api/panel/planes/{$id}", ['anio' => 2030, 'version' => 'B'])->assertNoContent();

        $this->getJson("/api/panel/planes/{$id}")
            ->assertOk()
            ->assertJsonPath('data.version', 'B')
            ->assertJsonPath('data.estado', 'borrador')
            ->assertJsonStructure(['data' => ['cursos', 'prerrequisitos', 'pdf_plan_url', 'pdf_resolucion_url']]);

        $this->getJson('/api/panel/planes')->assertOk()->assertJsonPath('data.0.id_plan', $id)
            ->assertJsonPath('data.0.total_cursos', 0);

        $this->getJson('/api/panel/planes/999999')->assertNotFound();
    }

    public function test_crud_de_cursos_e_importacion(): void
    {
        $this->iniciarSesionPlan('Editor');
        $idPlan = $this->postJson('/api/panel/planes', ['anio' => 2031, 'version' => 'A'])->json('data.id_plan');

        $idCurso = $this->postJson("/api/panel/planes/{$idPlan}/cursos", $this->datosCurso('C1'))
            ->assertCreated()->json('data.id_curso');

        $this->postJson("/api/panel/planes/{$idPlan}/cursos", $this->datosCurso('C1'))
            ->assertStatus(409)->assertJsonPath('error.codigo', 'DUPLICADO');

        $this->postJson("/api/panel/planes/{$idPlan}/cursos", $this->datosCurso('C2', ['creditos' => 11]))
            ->assertStatus(422);

        $this->putJson("/api/panel/cursos/{$idCurso}", $this->datosCurso('C1', ['nombre' => 'Nuevo nombre']))->assertNoContent();

        $this->postJson("/api/panel/planes/{$idPlan}/cursos/importar", ['cursos' => [
            $this->datosCurso('C1', ['creditos' => 5]), $this->datosCurso('C3', ['ciclo' => 2]),
        ]])->assertOk()->assertJsonPath('data.importados', 2);

        $this->postJson("/api/panel/planes/{$idPlan}/cursos/importar", ['cursos' => [
            $this->datosCurso('C4'), $this->datosCurso('C5', ['ciclo' => 11]),
        ]])->assertStatus(422)->assertJsonPath('error.codigo', 'REGLA_NEGOCIO');

        $this->getJson("/api/panel/planes/{$idPlan}")->assertJsonCount(2, 'data.cursos')
            ->assertJsonPath('data.cursos.0.creditos', 5);

        $this->deleteJson("/api/panel/cursos/{$idCurso}")->assertNoContent();
        $this->getJson("/api/panel/planes/{$idPlan}")->assertJsonCount(1, 'data.cursos');
    }

    public function test_prerrequisito_circular_devuelve_422_con_la_ruta(): void
    {
        $idEditor = $this->iniciarSesionPlan('Editor');
        $idPlan = $this->crearPlanBorrador($idEditor);
        $a = $this->crearCurso($idEditor, $idPlan, 'AAA', 1);
        $b = $this->crearCurso($idEditor, $idPlan, 'BBB', 2);

        $this->putJson("/api/panel/cursos/{$b['id_curso']}/prerrequisitos", ['ids_requeridos' => [$a['id_curso']]])->assertNoContent();

        $respuesta = $this->putJson("/api/panel/cursos/{$a['id_curso']}/prerrequisitos", ['ids_requeridos' => [$b['id_curso']]])
            ->assertStatus(422)->assertJsonPath('error.codigo', 'REGLA_NEGOCIO');

        $mensaje = $respuesta->json('error.campos.prerrequisitos.0');
        $this->assertStringContainsString('Prerrequisito circular: ', $mensaje);
        $this->assertStringContainsString('AAA', $mensaje);
        $this->assertStringContainsString('BBB', $mensaje);
        $this->assertSame(0, DB::table('prerrequisito')->where('id_curso', $a['id_curso'])->count());

        $this->putJson("/api/panel/cursos/{$a['id_curso']}/prerrequisitos", ['ids_requeridos' => [$a['id_curso']]])->assertStatus(422);
    }

    public function test_la_base_de_datos_tambien_rechaza_el_ciclo(): void
    {
        $idEditor = $this->crearUsuario('Editor');
        $idPlan = $this->crearPlanBorrador($idEditor);
        $a = $this->crearCurso($idEditor, $idPlan, 'AAA', 1);
        $b = $this->crearCurso($idEditor, $idPlan, 'BBB', 2);
        DB::table('prerrequisito')->insert(['id_curso' => $b['id_curso'], 'id_curso_requerido' => $a['id_curso']]);

        $this->assertNull($this->ejecutor()->escalar('sp_plan_detectar_ciclo', [$idPlan]));
        DB::table('prerrequisito')->insert(['id_curso' => $a['id_curso'], 'id_curso_requerido' => $b['id_curso']]);
        $this->assertNotNull($this->ejecutor()->escalar('sp_plan_detectar_ciclo', [$idPlan]));
    }

    public function test_enviar_sin_pdf_devuelve_422_y_con_pdf_pasa_a_revision(): void
    {
        $idEditor = $this->iniciarSesionPlan('Editor');
        $idPlan = $this->crearPlanBorrador($idEditor);
        $this->crearCurso($idEditor, $idPlan, 'X1', 1);

        $this->getJson("/api/panel/planes/{$idPlan}/validacion")->assertOk()
            ->assertJsonFragment(['codigo' => 'FALTA_PDF_PLAN']);
        $this->postJson("/api/panel/planes/{$idPlan}/enviar-revision")->assertStatus(422);

        foreach (['plan', 'resolucion'] as $tipo) {
            $url = $this->post("/api/panel/planes/{$idPlan}/pdf/{$tipo}", ['archivo' => UploadedFile::fake()->create('doc.pdf', 100, 'application/pdf')], ['Accept' => 'application/json'])
                ->assertOk()->json('data.url');
            $this->assertNotEmpty($url);
        }
        $this->assertCount(2, Storage::disk('public')->allFiles("planes/{$idPlan}"));

        $this->post("/api/panel/planes/{$idPlan}/pdf/plan", ['archivo' => UploadedFile::fake()->create('doc.txt', 10, 'text/plain')], ['Accept' => 'application/json'])
            ->assertStatus(422);

        $this->postJson("/api/panel/planes/{$idPlan}/enviar-revision")->assertNoContent();
        $this->assertSame('en_revision', DB::table('plan_estudios')->where('id_plan', $idPlan)->value('estado'));

        $this->postJson("/api/panel/planes/{$idPlan}/enviar-revision")->assertStatus(409);
        $this->putJson("/api/panel/planes/{$idPlan}", ['anio' => 2040, 'version' => 'Z'])->assertStatus(409);
        $this->postJson("/api/panel/planes/{$idPlan}/cursos", $this->datosCurso('NUEVO'))->assertStatus(409);
    }

    public function test_reemplazar_pdf_borra_el_anterior_tras_el_commit(): void
    {
        $idEditor = $this->iniciarSesionPlan('Editor');
        $idPlan = $this->crearPlanBorrador($idEditor);
        $subir = fn () => $this->post("/api/panel/planes/{$idPlan}/pdf/plan", ['archivo' => UploadedFile::fake()->create('a.pdf', 10, 'application/pdf')], ['Accept' => 'application/json'])->assertOk();

        $subir();
        $subir();

        $this->assertNotNull(DB::table('plan_estudios')->where('id_plan', $idPlan)->value('archivo_pdf_plan'));
    }

    public function test_aprobar_como_vigente_deja_un_unico_predeterminado_y_la_anterior_historica(): void
    {
        $idEditor = $this->crearUsuario('Editor');
        $anterior = $this->crearPlanPublicado($idEditor, true, 'A');
        $nueva = $this->crearPlanListo($idEditor, 'N');
        $this->ejecutor()->ejecutar('sp_plan_enviar_revision', [$idEditor, $nueva]);

        $idRevisor = $this->iniciarSesionPlan('Revisor');
        $this->assertSame('vigente', app(PlanEstudiosServicio::class)->decidir($idRevisor, $nueva, TipoDecision::Aprobar, null, true));

        $this->assertSame('historico', DB::table('plan_estudios')->where('id_plan', $anterior)->value('estado'));
        $this->assertSame('vigente', DB::table('plan_estudios')->where('id_plan', $nueva)->value('estado'));
        $this->assertSame([$nueva], DB::table('plan_estudios')->where('es_predeterminada', true)->pluck('id_plan')->map(fn ($i) => (int) $i)->all());

        $this->postJson("/api/panel/planes/{$anterior}/predeterminado")->assertNoContent();
        $this->assertSame([$anterior], DB::table('plan_estudios')->where('es_predeterminada', true)->pluck('id_plan')->map(fn ($i) => (int) $i)->all());
    }

    public function test_el_editor_no_puede_aprobar_su_propio_plan(): void
    {
        $idEditor = $this->crearUsuario('Editor');
        $idPlan = $this->crearPlanListo($idEditor);
        $this->ejecutor()->ejecutar('sp_plan_enviar_revision', [$idEditor, $idPlan]);

        $this->expectException(AccesoDenegadoException::class);
        app(PlanEstudiosServicio::class)->decidir($idEditor, $idPlan, TipoDecision::Aprobar);
    }

    public function test_duplicar_copia_cursos_y_prerrequisitos(): void
    {
        $idEditor = $this->iniciarSesionPlan('Editor');
        $origen = $this->crearPlanPublicado($idEditor);

        $copia = $this->postJson("/api/panel/planes/{$origen}/duplicar", ['version' => 'COPIA'])
            ->assertCreated()->json('data.id_plan');

        $this->getJson("/api/panel/planes/{$copia}")
            ->assertJsonPath('data.estado', 'borrador')
            ->assertJsonCount(2, 'data.cursos')
            ->assertJsonCount(1, 'data.prerrequisitos');
    }

    public function test_permisos_por_rol(): void
    {
        $this->getJson('/api/panel/planes')->assertUnauthorized();

        $this->iniciarSesionPlan('Administrador');
        $this->getJson('/api/panel/planes')->assertForbidden()->assertJsonPath('error.codigo', 'ROL_NO_AUTORIZADO');

        $idEditor = $this->iniciarSesionPlan('Editor');
        $idPlan = $this->crearPlanPublicado($idEditor);
        $this->getJson('/api/panel/planes')->assertOk();
        $this->postJson("/api/panel/planes/{$idPlan}/predeterminado")->assertForbidden();

        $this->iniciarSesionPlan('Revisor');
        $this->getJson('/api/panel/planes')->assertOk();
        $this->postJson("/api/panel/planes/{$idPlan}/predeterminado")->assertNoContent();
    }

    public function test_publico_solo_expone_vigente_e_historico_con_forma_para_reactflow(): void
    {
        $idEditor = $this->crearUsuario('Editor');
        $vigente = $this->crearPlanPublicado($idEditor, true, 'V');
        $historico = $this->crearPlanPublicado($idEditor, false, 'H');
        $borrador = $this->crearPlanListo($idEditor, 'B');
        $revision = $this->crearPlanListo($idEditor, 'R');
        $this->ejecutor()->ejecutar('sp_plan_enviar_revision', [$idEditor, $revision]);

        $respuesta = $this->getJson('/api/publico/planes')->assertOk();
        $ids = collect($respuesta->json('data'))->pluck('id_plan')->all();
        sort($ids);
        $this->assertSame([$vigente, $historico], $ids);
        $this->assertSame($vigente, $respuesta->json('data.0.id_plan'));
        $this->assertStringNotContainsString('id_editor', $respuesta->getContent());

        $this->getJson("/api/publico/planes/{$borrador}")->assertNotFound();
        $this->getJson("/api/publico/planes/{$revision}")->assertNotFound();

        $this->getJson('/api/publico/planes/predeterminado')->assertOk()->assertJsonPath('data.plan.id_plan', $vigente);

        $this->getJson("/api/publico/planes/{$vigente}")
            ->assertOk()
            ->assertHeader('Cache-Control')
            ->assertJsonPath('data.plan.estado', 'vigente')
            ->assertJsonPath('data.cursos.0.id', 'V1')
            ->assertJsonPath('data.cursos.0.cycle', 'Ciclo I')
            ->assertJsonPath('data.cursos.1.cycle', 'Ciclo II')
            ->assertJsonPath('data.cursos.0.isElective', false)
            ->assertJsonPath('data.aristas.0.source', 'V1')
            ->assertJsonPath('data.aristas.0.target', 'V2')
            ->assertJsonPath('data.columnas.Ciclo II', 320)
            ->assertJsonStructure(['data' => ['cursos' => [['id', 'name', 'type', 'credits', 'hoursT', 'hoursP', 'cycle', 'isElective', 'description']], 'aristas' => [['id', 'source', 'target']], 'prerrequisitos']]);
    }
}
