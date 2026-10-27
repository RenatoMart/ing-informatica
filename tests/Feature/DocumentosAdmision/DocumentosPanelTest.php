<?php

namespace Tests\Feature\DocumentosAdmision;

use App\Aplicacion\Compartido\Correos\ContenidoEnRevisionMail;
use App\Aplicacion\DocumentosAdmision\DocumentosServicio;
use App\Dominio\Compartido\Excepciones\AccesoDenegadoException;
use App\Dominio\Revision\TipoDecision;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Tests\Concerns\DatosDocumentosAdmision;
use Tests\TestCase;

/**
 * Panel de documentos oficiales: registrar → revisión → vigente, reemplazo, edición y permisos.
 */
class DocumentosPanelTest extends TestCase
{
    use DatosDocumentosAdmision;

    private int $editor;

    private int $revisor;

    private int $departamento;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');
        Mail::fake();
        $this->asegurarRoles();

        $this->editor = $this->crearUsuario('Editor');
        $this->revisor = $this->crearUsuario('Revisor');
        $this->departamento = $this->crearDepartamentoEmisor();
        $this->actuarComo($this->editor, 'Editor');
    }

    public function test_registrar_pasa_a_revision_guarda_el_pdf_y_avisa_al_revisor(): void
    {
        $respuesta = $this->postJson('/api/panel/documentos', $this->datosDocumento($this->departamento) + ['archivo' => $this->pdfDePrueba()]);

        $respuesta->assertCreated();
        $id = $respuesta->json('data.id');

        $fila = DB::table('documento_oficial')->where('id_documento', $id)->first();
        $this->assertSame('en_revision', $fila->estado);
        $this->assertSame($this->editor, $fila->id_editor);
        Storage::disk('public')->assertExists($fila->archivo_pdf);
        Mail::assertSent(ContenidoEnRevisionMail::class);

        $this->getJson("/api/panel/documentos/{$id}")
            ->assertOk()
            ->assertJsonPath('data.estado', 'en_revision')
            ->assertJsonPath('data.versiones_anteriores', [])
            ->assertJsonStructure(['data' => ['archivo_url']]);
    }

    public function test_aprobar_lo_deja_vigente_y_visible_en_el_publico(): void
    {
        $id = $this->postJson('/api/panel/documentos', $this->datosDocumento($this->departamento, ['numero' => 'RES-001']) + ['archivo' => $this->pdfDePrueba()])->json('data.id');

        $estado = app(DocumentosServicio::class)->decidir($this->revisor, $id, TipoDecision::Aprobar);

        $this->assertSame('vigente', $estado);
        $this->getJson('/api/publico/documentos')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.numero', 'RES-001');
    }

    public function test_reemplazo_pasa_el_anterior_a_historico_y_encadena_las_versiones(): void
    {
        $primero = $this->crearDocumentoVigente($this->editor, $this->revisor, $this->departamento);

        $segundo = $this->postJson('/api/panel/documentos', $this->datosDocumento($this->departamento, ['id_version_anterior' => $primero]) + ['archivo' => $this->pdfDePrueba()])
            ->assertCreated()->json('data.id');

        app(DocumentosServicio::class)->decidir($this->revisor, $segundo, TipoDecision::Aprobar);

        $this->assertSame('historico', DB::table('documento_oficial')->where('id_documento', $primero)->value('estado'));
        $this->assertSame('vigente', DB::table('documento_oficial')->where('id_documento', $segundo)->value('estado'));

        $this->getJson("/api/panel/documentos/{$segundo}")->assertJsonPath('data.versiones_anteriores.0.id_documento', $primero);
        $this->getJson("/api/panel/documentos/{$primero}")->assertJsonPath('data.versiones_posteriores.0.id_documento', $segundo);
    }

    public function test_la_version_anterior_debe_ser_del_mismo_tipo_vigente_y_sin_reemplazo(): void
    {
        $guia = $this->crearDocumentoVigente($this->editor, $this->revisor, $this->departamento, ['tipo' => 'guia']);
        $enRevision = $this->crearDocumentoEnRevision($this->editor, $this->departamento);

        $this->postJson('/api/panel/documentos', $this->datosDocumento($this->departamento, ['id_version_anterior' => $guia]) + ['archivo' => $this->pdfDePrueba()])
            ->assertStatus(409);
        $this->postJson('/api/panel/documentos', $this->datosDocumento($this->departamento, ['id_version_anterior' => $enRevision]) + ['archivo' => $this->pdfDePrueba()])
            ->assertStatus(409);

        $vigente = $this->crearDocumentoVigente($this->editor, $this->revisor, $this->departamento);
        $this->crearDocumentoEnRevision($this->editor, $this->departamento, [], $vigente);
        $this->postJson('/api/panel/documentos', $this->datosDocumento($this->departamento, ['id_version_anterior' => $vigente]) + ['archivo' => $this->pdfDePrueba()])
            ->assertStatus(409);
    }

    public function test_valida_fechas_y_archivo(): void
    {
        $base = $this->datosDocumento($this->departamento);

        $this->postJson('/api/panel/documentos', array_merge($base, ['fecha_vigencia' => now()->subYear()->toDateString()]) + ['archivo' => $this->pdfDePrueba()])
            ->assertStatus(422)->assertJsonPath('error.codigo', 'VALIDACION');
        $this->postJson('/api/panel/documentos', $base)->assertStatus(422);
        $this->postJson('/api/panel/documentos', $base + ['archivo' => UploadedFile::fake()->create('a.png', 10, 'image/png')])->assertStatus(422);
        $this->assertSame(0, DB::table('documento_oficial')->count());
    }

    public function test_observar_permite_editar_reemplazar_el_pdf_y_reenviar(): void
    {
        $id = $this->crearDocumentoEnRevision($this->editor, $this->departamento);
        DB::table('documento_oficial')->where('id_documento', $id)->update(['archivo_pdf' => 'documentos/viejo.pdf']);
        Storage::disk('public')->put('documentos/viejo.pdf', 'x');

        // Editar en revisión no está permitido.
        $this->postJson("/api/panel/documentos/{$id}", ['_method' => 'PUT'] + $this->datosDocumento($this->departamento))->assertStatus(409);

        $this->assertSame('no_publicado', app(DocumentosServicio::class)->decidir($this->revisor, $id, TipoDecision::Observar, 'Falta el sello de la resolución'));

        $this->post("/api/panel/documentos/{$id}", ['_method' => 'PUT', 'titulo' => 'Título corregido'] + $this->datosDocumento($this->departamento) + ['archivo' => $this->pdfDePrueba('nuevo.pdf')], ['Accept' => 'application/json'])
            ->assertNoContent();

        $fila = DB::table('documento_oficial')->where('id_documento', $id)->first();
        $this->assertSame('Título corregido', $fila->titulo);
        $this->assertNotSame('documentos/viejo.pdf', $fila->archivo_pdf);
        Storage::disk('public')->assertExists($fila->archivo_pdf);
        Storage::disk('public')->assertMissing('documentos/viejo.pdf');

        $this->postJson("/api/panel/documentos/{$id}/reenviar")->assertNoContent();
        $this->assertSame('en_revision', DB::table('documento_oficial')->where('id_documento', $id)->value('estado'));
        $this->postJson("/api/panel/documentos/{$id}/reenviar")->assertStatus(409);
    }

    public function test_el_editor_no_puede_decidir_su_propio_documento(): void
    {
        $id = $this->crearDocumentoEnRevision($this->editor, $this->departamento);

        $this->expectException(AccesoDenegadoException::class);
        app(DocumentosServicio::class)->decidir($this->editor, $id, TipoDecision::Aprobar);
    }

    public function test_listado_filtra_por_tipo_y_estado_y_pagina(): void
    {
        $this->crearDocumentoEnRevision($this->editor, $this->departamento, ['tipo' => 'guia']);
        $this->crearDocumentoVigente($this->editor, $this->revisor, $this->departamento);

        $this->getJson('/api/panel/documentos?tipo=guia')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('meta.total', 1);
        $this->getJson('/api/panel/documentos?estado=vigente')->assertOk()->assertJsonCount(1, 'data');
        $this->getJson('/api/panel/documentos')->assertOk()->assertJsonPath('meta.total', 2);
    }

    public function test_permisos_del_panel(): void
    {
        $this->getJson('/api/panel/documentos')->assertOk();

        $admin = $this->crearUsuario('Administrador');
        $this->actuarComo($admin, 'Administrador');
        $this->getJson('/api/panel/documentos')->assertStatus(403)->assertJsonPath('error.codigo', 'ROL_NO_AUTORIZADO');
        $this->postJson('/api/panel/campanas', $this->datosCampana())->assertStatus(403);
    }

    public function test_sin_sesion_responde_401(): void
    {
        $this->app['auth']->forgetGuards();

        $this->getJson('/api/panel/documentos')->assertStatus(401)->assertJsonPath('error.codigo', 'NO_AUTENTICADO');
    }
}
