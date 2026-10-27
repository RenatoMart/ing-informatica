<?php

namespace Tests\Feature\Docentes;

use App\Aplicacion\Compartido\Correos\ContenidoEnRevisionMail;
use App\Aplicacion\Docentes\DocentesServicio;
use App\Dominio\Compartido\Excepciones\TransicionInvalidaException;
use App\Dominio\Revision\TipoDecision;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Tests\Concerns\DatosDocentes;
use Tests\Concerns\DatosPublicaciones;
use Tests\TestCase;

class DocentesPanelTest extends TestCase
{
    use DatosDocentes;
    use DatosPublicaciones;

    private int $editor;

    private int $revisor;

    private int $departamento;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');
        Mail::fake();
        $this->sembrarRolesPortal();

        $this->editor = $this->crearUsuario('Editor');
        $this->revisor = $this->crearUsuario('Revisor');
        $this->departamento = $this->crearDepartamento($this->editor);
    }

    /**
     * @return array<string, mixed>
     */
    private function datosDocente(array $cambios = []): array
    {
        return $cambios + [
            'nombres' => 'Luis', 'apellidos' => 'Quispe Rojas', 'grado_academico' => 'Mg.',
            'id_departamento' => $this->departamento, 'curso_principal' => 'Bases de datos',
            'condicion_laboral' => 'contratado', 'es_investigador' => false,
            'especialidades' => ['Bases de datos', 'Minería de datos'],
        ];
    }

    public function test_flujo_completo_borrador_revision_publicado(): void
    {
        $this->autenticarComo($this->editor, 'Editor');

        $id = $this->postJson('/api/panel/docentes', $this->datosDocente())->assertCreated()->json('data.id_docente');
        $this->assertSame('borrador', $this->estadoDocente($id));

        $this->getJson("/api/panel/docentes/{$id}")
            ->assertOk()
            ->assertJsonPath('data.especialidades', ['Bases de datos', 'Minería de datos'])
            ->assertJsonPath('data.foto_url', null)
            ->assertJsonPath('data.encuadre_x', 50)
            ->assertJsonPath('data.encuadre_y', 25);

        $this->getJson('/api/publico/docentes')->assertOk()->assertJsonCount(0, 'data');

        $this->postJson("/api/panel/docentes/{$id}/enviar-revision")->assertNoContent();
        Mail::assertSent(ContenidoEnRevisionMail::class);

        $this->assertSame('publicado', app(DocentesServicio::class)->decidir($this->revisor, $id, TipoDecision::Aprobar));

        $this->getJson('/api/publico/docentes')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonStructure(['data' => [['id_docente', 'nombres', 'apellidos', 'grado_academico', 'departamento', 'curso_principal', 'especialidades', 'condicion_laboral', 'es_investigador', 'categoria_renacyt', 'foto_url', 'encuadre_x', 'encuadre_y']]])
            ->assertJsonPath('data.0.especialidades', ['Bases de datos', 'Minería de datos'])
            ->assertJsonPath('data.0.condicion_laboral', 'contratado');
    }

    public function test_reglas_de_renacyt_y_especialidades(): void
    {
        $this->autenticarComo($this->editor, 'Editor');

        $this->postJson('/api/panel/docentes', $this->datosDocente(['categoria_renacyt' => 'Nivel I']))
            ->assertStatus(422)->assertJsonPath('error.codigo', 'REGLA_NEGOCIO')->assertJsonStructure(['error' => ['campos' => ['categoria_renacyt']]]);

        $this->postJson('/api/panel/docentes', $this->datosDocente(['es_investigador' => true]))
            ->assertStatus(422)->assertJsonStructure(['error' => ['campos' => ['categoria_renacyt']]]);

        $this->postJson('/api/panel/docentes', $this->datosDocente(['especialidades' => ['a', 'b', 'c', 'd', 'e', 'f']]))
            ->assertStatus(422)->assertJsonPath('error.codigo', 'VALIDACION');

        $this->postJson('/api/panel/docentes', $this->datosDocente(['especialidades' => ['IA', 'IA']]))
            ->assertStatus(422)->assertJsonPath('error.codigo', 'REGLA_NEGOCIO')->assertJsonStructure(['error' => ['campos' => ['especialidades']]]);

        $this->postJson('/api/panel/docentes', $this->datosDocente(['condicion_laboral' => 'otro']))
            ->assertStatus(422)->assertJsonPath('error.codigo', 'VALIDACION');

        $this->postJson('/api/panel/docentes', $this->datosDocente(['es_investigador' => true, 'categoria_renacyt' => 'Nivel I']))
            ->assertCreated();
    }

    public function test_enviar_exige_grado_y_curso(): void
    {
        $id = $this->crearDocenteBorrador($this->editor, $this->departamento, ['grado' => null]);
        $this->autenticarComo($this->editor, 'Editor');

        $this->postJson("/api/panel/docentes/{$id}/enviar-revision")
            ->assertStatus(422)->assertJsonStructure(['error' => ['campos' => ['grado_academico']]]);
    }

    public function test_cambio_sobre_publicado_no_lo_retira_hasta_aprobar(): void
    {
        $id = $this->crearDocentePublicado($this->editor, $this->revisor, $this->departamento, ['apellidos' => 'Original']);
        $this->autenticarComo($this->editor, 'Editor');

        $this->putJson("/api/panel/docentes/{$id}", $this->datosDocente(['apellidos' => 'Modificado']))
            ->assertOk()->assertJsonPath('data.modo', 'cambio_pendiente');

        $this->getJson('/api/publico/docentes')->assertJsonPath('data.0.apellidos', 'Original');
        $this->getJson("/api/panel/docentes/{$id}")->assertJsonPath('data.cambios_pendientes.apellidos', 'Modificado');

        app(DocentesServicio::class)->decidir($this->revisor, $id, TipoDecision::Aprobar);
        $this->getJson('/api/publico/docentes')->assertJsonPath('data.0.apellidos', 'Modificado');
    }

    public function test_baja_pasa_a_inactivo_y_sale_del_publico_y_se_puede_reactivar(): void
    {
        $id = $this->crearDocentePublicado($this->editor, $this->revisor, $this->departamento);
        $this->autenticarComo($this->editor, 'Editor');

        $this->postJson("/api/panel/docentes/{$id}/solicitar-baja")->assertNoContent();
        $this->getJson('/api/publico/docentes')->assertJsonCount(1, 'data');

        app(DocentesServicio::class)->decidir($this->revisor, $id, TipoDecision::Aprobar);
        $this->assertSame('inactivo', $this->estadoDocente($id));
        $this->getJson('/api/publico/docentes')->assertJsonCount(0, 'data');

        $this->postJson("/api/panel/docentes/{$id}/reactivar")->assertNoContent();
        $this->assertSame('borrador', $this->estadoDocente($id));
        $this->assertSame(1, DB::table('docente')->where('id_docente', $id)->count(), 'La baja no elimina el registro.');
    }

    public function test_el_docente_no_admite_descartar_ni_aprobar_su_propio_registro(): void
    {
        $id = $this->crearDocenteEnRevision($this->editor, $this->departamento);

        try {
            app(DocentesServicio::class)->decidir($this->revisor, $id, TipoDecision::Descartar, 'No procede el alta.');
            $this->fail('Debió rechazar descartar.');
        } catch (TransicionInvalidaException) {
            $this->assertSame('en_revision', $this->estadoDocente($id));
        }

        $this->assertSame('borrador', app(DocentesServicio::class)->decidir($this->revisor, $id, TipoDecision::Observar, 'Complete los datos.'));
    }

    public function test_foto_invalida_se_rechaza_y_no_deja_archivos(): void
    {
        $id = $this->crearDocenteBorrador($this->editor, $this->departamento);
        $this->autenticarComo($this->editor, 'Editor');

        $this->postJson("/api/panel/docentes/{$id}/foto", ['foto' => UploadedFile::fake()->create('cv.pdf', 20, 'application/pdf')])
            ->assertStatus(422)->assertJsonPath('error.codigo', 'VALIDACION');

        $this->postJson("/api/panel/docentes/{$id}/foto", ['foto' => $this->imagenPng(100, 100)])
            ->assertStatus(422)->assertJsonPath('error.codigo', 'REGLA_NEGOCIO')->assertJsonStructure(['error' => ['campos' => ['foto']]]);

        $this->postJson("/api/panel/docentes/{$id}/foto", ['foto' => $this->imagenPng(400, 400), 'encuadre_x' => 150])
            ->assertStatus(422)->assertJsonPath('error.codigo', 'VALIDACION');

        $this->assertSame([], Storage::disk('public')->allFiles());
    }

    public function test_foto_se_guarda_como_webp_de_maximo_900px_y_reemplazo_borra_la_anterior(): void
    {
        if (! extension_loaded('gd')) {
            $this->markTestSkipped('Requiere la extensión php-gd.');
        }

        $id = $this->crearDocenteBorrador($this->editor, $this->departamento);
        $this->autenticarComo($this->editor, 'Editor');

        $url = $this->postJson("/api/panel/docentes/{$id}/foto", ['foto' => $this->imagenPng(1800, 1200), 'encuadre_x' => 30, 'encuadre_y' => 60])
            ->assertOk()->json('data.foto_url');
        $this->assertStringEndsWith('.webp', $url);

        $ruta = DB::table('docente')->where('id_docente', $id)->value('ruta_fotografia');
        $this->assertStringStartsWith('docentes/', $ruta);
        [$ancho, $alto] = getimagesizefromstring(Storage::disk('public')->get($ruta));
        $this->assertSame([900, 600], [$ancho, $alto]);
        $this->assertSame([30, 60], [DB::table('docente')->where('id_docente', $id)->value('encuadre_x'), DB::table('docente')->where('id_docente', $id)->value('encuadre_y')]);

        $this->postJson("/api/panel/docentes/{$id}/foto", ['foto' => $this->imagenPng(400, 400)])->assertOk();
        Storage::disk('public')->assertMissing($ruta);
        $this->assertCount(1, Storage::disk('public')->allFiles());
    }

    public function test_encuadre(): void
    {
        $id = $this->crearDocentePublicado($this->editor, $this->revisor, $this->departamento);
        $this->autenticarComo($this->editor, 'Editor');

        $this->patchJson("/api/panel/docentes/{$id}/encuadre", ['encuadre_x' => 101, 'encuadre_y' => 0])
            ->assertStatus(422)->assertJsonPath('error.codigo', 'VALIDACION');

        $this->patchJson("/api/panel/docentes/{$id}/encuadre", ['encuadre_x' => 10, 'encuadre_y' => 90])->assertNoContent();

        $this->getJson('/api/publico/docentes')->assertJsonPath('data.0.encuadre_x', 50)->assertJsonPath('data.0.encuadre_y', 25);
        app(DocentesServicio::class)->decidir($this->revisor, $id, TipoDecision::Aprobar);
        $this->getJson('/api/publico/docentes')->assertJsonPath('data.0.encuadre_x', 10)->assertJsonPath('data.0.encuadre_y', 90);
    }

    public function test_listado_del_panel_con_filtros(): void
    {
        $otro = $this->crearDepartamento($this->editor);
        $a = $this->crearDocenteBorrador($this->editor, $this->departamento, ['apellidos' => 'Peña Zavala']);
        $this->crearDocentePublicado($this->editor, $this->revisor, $otro, ['apellidos' => 'Gomez']);
        $this->autenticarComo($this->revisor, 'Revisor');

        $this->getJson("/api/panel/docentes?id_departamento={$this->departamento}")
            ->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.id_docente', $a)->assertJsonPath('meta.total', 1);
        $this->getJson('/api/panel/docentes?estado=publicado&id_departamento='.$otro)->assertJsonCount(1, 'data');
        $this->getJson('/api/panel/docentes?q=pena')->assertJsonCount(1, 'data');
        $this->getJson('/api/panel/docentes?estado=x')->assertStatus(422);
    }

    public function test_permisos_por_rol(): void
    {
        $this->getJson('/api/panel/docentes')->assertUnauthorized();
        $this->getJson('/api/panel/departamentos')->assertUnauthorized();

        $this->autenticarComo($this->crearUsuario('Administrador'), 'Administrador');
        $this->getJson('/api/panel/docentes')->assertForbidden();
        $this->postJson('/api/panel/departamentos', ['nombre' => 'X'])->assertForbidden();

        $this->autenticarComo($this->editor, 'Editor');
        $this->getJson('/api/panel/docentes')->assertOk();
    }

    public function test_departamentos_del_panel(): void
    {
        $this->autenticarComo($this->editor, 'Editor');

        $id = $this->postJson('/api/panel/departamentos', ['nombre' => 'Dpto. de Sistemas', 'correo' => 'sistemas@unitru.edu.pe'])
            ->assertCreated()->json('data.id_departamento');

        $this->postJson('/api/panel/departamentos', ['nombre' => 'Dpto. de Sistemas'])->assertStatus(409)->assertJsonPath('error.codigo', 'DUPLICADO');
        $this->postJson('/api/panel/departamentos', ['nombre' => ''])->assertStatus(422);
        $this->putJson("/api/panel/departamentos/{$id}", ['nombre' => 'Dpto. de Sistemas II', 'correo' => 'x@unitru.edu.pe'])->assertNoContent();
        $this->putJson('/api/panel/departamentos/99999999', ['nombre' => 'Fantasma'])->assertNotFound();

        $this->getJson('/api/panel/departamentos')->assertOk()
            ->assertJsonFragment(['id_departamento' => $id, 'nombre' => 'Dpto. de Sistemas II', 'correo' => 'x@unitru.edu.pe']);
    }
}
