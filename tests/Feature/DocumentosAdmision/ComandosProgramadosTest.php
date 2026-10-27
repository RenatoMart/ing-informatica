<?php

namespace Tests\Feature\DocumentosAdmision;

use App\Aplicacion\Compartido\Correos\ContenidoEnRevisionMail;
use App\Aplicacion\DocumentosAdmision\Correos\CampanaCerradaMail;
use App\Aplicacion\DocumentosAdmision\Correos\DocumentoPorVencerMail;
use App\Aplicacion\DocumentosAdmision\Correos\DocumentoVencidoMail;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Tests\Concerns\DatosDocumentosAdmision;
use Tests\TestCase;

/**
 * Comandos `portal:vencer-documentos`, `portal:avisar-vencimientos` y `portal:cerrar-campanas`.
 */
class ComandosProgramadosTest extends TestCase
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
        $this->revisor = $this->crearUsuario('Revisor', ['correo' => 'director@unitru.edu.pe']);
    }

    public function test_vencer_documentos_pasa_a_vencido_y_avisa_al_area(): void
    {
        $area = $this->crearDepartamentoEmisor('area.vencidos@unitru.edu.pe');
        $expirado = $this->crearDocumentoVigente($this->editor, $this->revisor, $area);
        $vigente = $this->crearDocumentoVigente($this->editor, $this->revisor, $area);
        DB::table('documento_oficial')->where('id_documento', $expirado)->update(['fecha_vigencia' => now()->subDay()->toDateString()]);

        $this->artisan('portal:vencer-documentos')->expectsOutput('Documentos vencidos: 1.')->assertSuccessful();

        $this->assertSame('vencido', DB::table('documento_oficial')->where('id_documento', $expirado)->value('estado'));
        $this->assertSame('vigente', DB::table('documento_oficial')->where('id_documento', $vigente)->value('estado'));
        Mail::assertSent(DocumentoVencidoMail::class, fn ($correo) => $correo->hasTo('area.vencidos@unitru.edu.pe') && $correo->idDocumento === $expirado);

        $this->artisan('portal:vencer-documentos')->expectsOutput('Documentos vencidos: 0.')->assertSuccessful();
        Mail::assertSent(DocumentoVencidoMail::class, 1);
    }

    public function test_vencer_documentos_sin_correo_del_area_avisa_a_los_revisores(): void
    {
        $area = $this->crearDepartamentoEmisor(null);
        $expirado = $this->crearDocumentoVigente($this->editor, $this->revisor, $area);
        DB::table('documento_oficial')->where('id_documento', $expirado)->update(['fecha_vigencia' => now()->subDays(3)->toDateString()]);

        $this->artisan('portal:vencer-documentos')->assertSuccessful();

        Mail::assertSent(DocumentoVencidoMail::class, fn ($correo) => $correo->hasTo('director@unitru.edu.pe'));
    }

    public function test_avisar_vencimientos_solo_los_que_vencen_en_15_dias(): void
    {
        $area = $this->crearDepartamentoEmisor('area.aviso@unitru.edu.pe');
        $en15 = $this->crearDocumentoVigente($this->editor, $this->revisor, $area, ['fecha_vigencia' => now()->addDays(15)->toDateString()]);
        $this->crearDocumentoVigente($this->editor, $this->revisor, $area, ['fecha_vigencia' => now()->addDays(14)->toDateString()]);
        $this->crearDocumentoVigente($this->editor, $this->revisor, $area, ['fecha_vigencia' => now()->addDays(16)->toDateString()]);

        $this->artisan('portal:avisar-vencimientos')->expectsOutput('Avisos de vencimiento enviados: 1.')->assertSuccessful();

        Mail::assertSent(DocumentoPorVencerMail::class, 1);
        Mail::assertSent(DocumentoPorVencerMail::class, fn ($correo) => $correo->hasTo('area.aviso@unitru.edu.pe') && $correo->idDocumento === $en15 && $correo->dias === 15);
        $this->assertSame('vigente', DB::table('documento_oficial')->where('id_documento', $en15)->value('estado'));
    }

    public function test_cerrar_campanas_cierra_la_vencida_y_avisa_a_la_comision(): void
    {
        config(['portal.correo_comision_admision' => 'comision.admision@unitru.edu.pe']);
        $vencida = $this->crearCampanaAprobada($this->editor, $this->revisor);
        DB::table('campana_admision')->where('id_campana', $vencida)->update([
            'fecha_inicio' => now()->subDays(90)->toDateString(),
            'fecha_fin' => now()->subDay()->toDateString(),
        ]);

        $this->artisan('portal:cerrar-campanas')->expectsOutput('Campañas cerradas: 1.')->assertSuccessful();

        $this->assertSame('cerrada', DB::table('campana_admision')->where('id_campana', $vencida)->value('estado'));
        Mail::assertSent(CampanaCerradaMail::class, fn ($correo) => $correo->hasTo('comision.admision@unitru.edu.pe') && $correo->idCampana === $vencida);
        $this->getJson('/api/publico/admision')->assertStatus(404);

        $this->artisan('portal:cerrar-campanas')->expectsOutput('Campañas cerradas: 0.')->assertSuccessful();
    }

    public function test_cerrar_campanas_no_toca_las_vigentes_en_curso(): void
    {
        $vigente = $this->crearCampanaAprobada($this->editor, $this->revisor);

        $this->artisan('portal:cerrar-campanas')->expectsOutput('Campañas cerradas: 0.')->assertSuccessful();

        $this->assertSame('vigente', DB::table('campana_admision')->where('id_campana', $vigente)->value('estado'));
        Mail::assertNotSent(CampanaCerradaMail::class);
        Mail::assertNotSent(ContenidoEnRevisionMail::class);
    }
}
