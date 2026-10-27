<?php

namespace Tests\Feature\DocumentosAdmision;

use App\Persistencia\Compartido\EjecutorProcedimientos;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Tests\Concerns\DatosDocumentosAdmision;
use Tests\TestCase;

/**
 * Sitio público: solo expone documentos vigentes/históricos y la campaña vigente, sin datos internos.
 */
class PublicoDocumentosAdmisionTest extends TestCase
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

        $this->editor = $this->crearUsuario('Editor', ['correo' => 'editor.secreto@unitru.edu.pe']);
        $this->revisor = $this->crearUsuario('Revisor');
        $this->departamento = $this->crearDepartamentoEmisor();
    }

    public function test_solo_se_muestran_los_vigentes_por_defecto(): void
    {
        $vigente = $this->crearDocumentoVigente($this->editor, $this->revisor, $this->departamento, ['numero' => 'V-1']);
        $this->crearDocumentoEnRevision($this->editor, $this->departamento, ['numero' => 'EN-REVISION']);
        $noPublicado = $this->crearDocumentoEnRevision($this->editor, $this->departamento, ['numero' => 'RECHAZADO']);
        app(EjecutorProcedimientos::class)->escalar('sp_documento_decidir', [$this->revisor, $noPublicado, 'observar', 'Falta el sello']);
        $vencido = $this->crearDocumentoVigente($this->editor, $this->revisor, $this->departamento, ['numero' => 'VENCIDO']);
        DB::table('documento_oficial')->where('id_documento', $vencido)->update(['estado' => 'vencido']);

        $respuesta = $this->getJson('/api/publico/documentos')->assertOk();

        $respuesta->assertJsonCount(1, 'data')->assertJsonPath('data.0.id_documento', $vigente);
        $this->assertStringContainsString('max-age=60', (string) $respuesta->headers->get('Cache-Control'));
        $this->assertStringContainsString('public', (string) $respuesta->headers->get('Cache-Control'));
    }

    public function test_historicos_y_filtro_por_tipo(): void
    {
        $anterior = $this->crearDocumentoVigente($this->editor, $this->revisor, $this->departamento, ['numero' => 'A']);
        $nuevo = $this->crearDocumentoVigente($this->editor, $this->revisor, $this->departamento, ['numero' => 'B'], $anterior);
        $this->crearDocumentoVigente($this->editor, $this->revisor, $this->departamento, ['numero' => 'G', 'tipo' => 'guia']);

        $this->getJson('/api/publico/documentos')->assertJsonCount(2, 'data');
        $this->getJson('/api/publico/documentos?historicos=1')->assertJsonCount(3, 'data');

        $historicos = $this->getJson('/api/publico/documentos?historicos=1&tipo=resolucion')->assertOk()->assertJsonCount(2, 'data');
        $this->assertSame([$nuevo, $anterior], array_column($historicos->json('data'), 'id_documento'));
        $this->assertSame(['vigente', 'historico'], array_column($historicos->json('data'), 'estado'));

        $this->getJson('/api/publico/documentos?tipo=guia')->assertJsonCount(1, 'data')->assertJsonPath('data.0.numero', 'G');
        $this->getJson('/api/publico/documentos?tipo=otro')->assertStatus(422);
    }

    public function test_forma_del_documento_publico_sin_datos_internos(): void
    {
        $this->crearDocumentoVigente($this->editor, $this->revisor, $this->departamento);

        $respuesta = $this->getJson('/api/publico/documentos')->assertOk();

        $this->assertEqualsCanonicalizing(
            ['id_documento', 'tipo', 'numero', 'titulo', 'fecha_emision', 'fecha_vigencia', 'departamento', 'estado', 'archivo_url'],
            array_keys($respuesta->json('data.0')),
        );
        $this->assertStringContainsString('/storage/documentos/', (string) $respuesta->json('data.0.archivo_url'));
        $this->assertStringNotContainsString('editor.secreto', $respuesta->getContent());
        $this->assertStringNotContainsString('id_editor', $respuesta->getContent());
    }

    public function test_admision_sin_campana_vigente_es_404(): void
    {
        $this->crearCampanaBorrador($this->editor);

        $this->getJson('/api/publico/admision')
            ->assertStatus(404)
            ->assertJsonPath('error.codigo', 'SIN_CAMPANA_VIGENTE');
    }

    public function test_admision_expone_campana_vigente_con_modalidades_y_cronograma(): void
    {
        $this->crearCampanaBorrador($this->editor, ['proceso' => 'BORRADOR']);
        $this->crearCampanaAprobada($this->editor, $this->revisor, ['proceso' => 'I']);

        $respuesta = $this->getJson('/api/publico/admision')->assertOk();

        $respuesta
            ->assertJsonPath('data.campana.proceso', 'I')
            ->assertJsonPath('data.modalidades.0.nombre', 'Ordinario')
            ->assertJsonPath('data.modalidades.0.vacantes', 30)
            ->assertJsonPath('data.cronograma.0.hito', 'Inscripciones');
        $this->assertEqualsCanonicalizing(
            ['anio', 'proceso', 'fecha_inicio', 'fecha_fin', 'url_portal', 'url_estadisticas'],
            array_keys($respuesta->json('data.campana')),
        );
        $this->assertEqualsCanonicalizing(['hito', 'fecha'], array_keys($respuesta->json('data.cronograma.0')));
        $this->assertStringNotContainsString('id_editor', $respuesta->getContent());
        $this->assertStringContainsString('max-age=60', (string) $respuesta->headers->get('Cache-Control'));
        $this->assertStringContainsString('public', (string) $respuesta->headers->get('Cache-Control'));
    }
}
