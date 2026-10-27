<?php

namespace Tests\Feature\Publicaciones;

use App\Aplicacion\Compartido\Correos\ContenidoEnRevisionMail;
use App\Aplicacion\Publicaciones\PublicacionesServicio;
use App\Dominio\Compartido\Excepciones\AccesoDenegadoException;
use App\Dominio\Compartido\Excepciones\ReglaNegocioException;
use App\Dominio\Revision\TipoDecision;
use App\Persistencia\Compartido\EjecutorProcedimientos;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Tests\Concerns\DatosPublicaciones;
use Tests\TestCase;

class PublicacionesPanelTest extends TestCase
{
    use DatosPublicaciones;

    private int $editor;

    private int $revisor;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');
        Mail::fake();
        $this->sembrarRolesPortal();

        $this->editor = $this->crearUsuario('Editor');
        $this->revisor = $this->crearUsuario('Revisor');
    }

    public function test_flujo_completo_borrador_revision_publicado(): void
    {
        $this->autenticarComo($this->editor, 'Editor');

        $id = $this->postJson('/api/panel/publicaciones', [
            'titulo' => 'Semana de la Informática',
            'resumen' => 'Resumen breve',
            'contenido' => '<p>Detalle</p>',
            'categoria' => 'Eventos',
        ])->assertCreated()->json('data.id_publicacion');

        $this->assertSame('borrador', DB::table('publicacion')->where('id_publicacion', $id)->value(DB::raw('estado::text')));

        // Sin imagen no se puede enviar.
        $this->postJson("/api/panel/publicaciones/{$id}/enviar-revision")
            ->assertStatus(422)
            ->assertJsonPath('error.codigo', 'REGLA_NEGOCIO')
            ->assertJsonPath('error.campos.archivos.0', 'Debe adjuntar al menos una imagen.');

        $this->adjuntarImagenDirecta($this->editor, $id);

        $this->postJson("/api/panel/publicaciones/{$id}/enviar-revision")->assertNoContent();
        Mail::assertSent(ContenidoEnRevisionMail::class);

        // Aún no es público.
        $this->getJson('/api/publico/publicaciones')->assertOk()->assertJsonCount(0, 'data');

        $estado = app(PublicacionesServicio::class)->decidir($this->revisor, $id, TipoDecision::Aprobar);
        $this->assertSame('publicada', $estado);

        $this->getJson('/api/publico/publicaciones')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id_publicacion', $id)
            ->assertJsonPath('meta.total', 1);

        $this->assertSame(3, DB::table('historial_revision')->where('entidad', 'publicacion')->where('id_registro', $id)->count());
    }

    public function test_listado_y_detalle_del_panel(): void
    {
        $id = $this->crearPublicacionBorrador($this->editor, ['titulo' => 'Titulo para listar']);
        [$idArchivo] = $this->adjuntarImagenDirecta($this->editor, $id);
        $this->autenticarComo($this->revisor, 'Revisor');

        $this->getJson('/api/panel/publicaciones?estado=borrador&q=listar')
            ->assertOk()
            ->assertJsonPath('data.0.id_publicacion', $id)
            ->assertJsonPath('data.0.estado', 'borrador')
            ->assertJsonStructure(['data' => [['id_publicacion', 'titulo', 'categoria', 'estado', 'operacion_pendiente', 'fecha_creacion', 'fecha_publicacion_programada', 'editor', 'imagen_portada_url']], 'meta' => ['pagina', 'por_pagina', 'total', 'ultima_pagina']]);

        $this->getJson("/api/panel/publicaciones/{$id}")
            ->assertOk()
            ->assertJsonPath('data.archivos.0.id_archivo', $idArchivo)
            ->assertJsonPath('data.cambios_pendientes', null)
            ->assertJsonPath('data.observaciones_revision', null);

        $this->getJson('/api/panel/publicaciones/99999999')->assertNotFound()->assertJsonPath('error.codigo', 'NO_ENCONTRADO');
        $this->getJson('/api/panel/publicaciones?estado=otro')->assertStatus(422)->assertJsonPath('error.codigo', 'VALIDACION');
    }

    public function test_el_revisor_no_puede_aprobar_lo_que_el_mismo_edito(): void
    {
        $id = $this->crearPublicacionEnRevision($this->revisor);

        $this->expectException(AccesoDenegadoException::class);
        app(PublicacionesServicio::class)->decidir($this->revisor, $id, TipoDecision::Aprobar);
    }

    public function test_rechazo_con_observaciones_devuelve_a_borrador(): void
    {
        $id = $this->crearPublicacionEnRevision($this->editor);
        $servicio = app(PublicacionesServicio::class);

        try {
            $servicio->decidir($this->revisor, $id, TipoDecision::Observar);
            $this->fail('Debió exigir observaciones.');
        } catch (ReglaNegocioException $e) {
            $this->assertSame('observaciones', $e->campo());
        }

        $this->assertSame('borrador', $servicio->decidir($this->revisor, $id, TipoDecision::Observar, 'Falta la fecha del evento.'));

        $this->autenticarComo($this->editor, 'Editor');
        $this->getJson("/api/panel/publicaciones/{$id}")
            ->assertOk()
            ->assertJsonPath('data.estado', 'borrador')
            ->assertJsonPath('data.observaciones_revision', 'Falta la fecha del evento.');
    }

    public function test_cambio_sobre_lo_publicado_no_lo_retira_hasta_aprobar(): void
    {
        $id = $this->crearPublicacionPublicada($this->editor, $this->revisor, ['titulo' => 'Titulo original']);
        $this->autenticarComo($this->editor, 'Editor');

        $this->putJson("/api/panel/publicaciones/{$id}", [
            'titulo' => 'Titulo corregido', 'resumen' => 'Nuevo resumen', 'categoria' => 'Eventos',
        ])->assertOk()->assertJsonPath('data.modo', 'cambio_pendiente');

        $this->getJson("/api/publico/publicaciones/{$id}")->assertOk()->assertJsonPath('data.titulo', 'Titulo original');

        $this->getJson("/api/panel/publicaciones/{$id}")
            ->assertJsonPath('data.operacion_pendiente', 'cambio')
            ->assertJsonPath('data.cambios_pendientes.titulo', 'Titulo corregido')
            ->assertJsonPath('data.titulo', 'Titulo original');

        // No admite otra baja ni envío mientras haya operación pendiente.
        $this->postJson("/api/panel/publicaciones/{$id}/solicitar-baja")->assertStatus(409)->assertJsonPath('error.codigo', 'ESTADO_INVALIDO');

        app(PublicacionesServicio::class)->decidir($this->revisor, $id, TipoDecision::Aprobar);
        $this->getJson("/api/publico/publicaciones/{$id}")->assertJsonPath('data.titulo', 'Titulo corregido');
    }

    public function test_cambio_observado_se_descarta_y_lo_publicado_sigue_igual(): void
    {
        $id = $this->crearPublicacionPublicada($this->editor, $this->revisor, ['titulo' => 'Titulo estable']);
        $this->autenticarComo($this->editor, 'Editor');
        $this->putJson("/api/panel/publicaciones/{$id}", ['titulo' => 'Titulo dudoso'])->assertOk();

        app(PublicacionesServicio::class)->decidir($this->revisor, $id, TipoDecision::Observar, 'No corresponde el cambio.');

        $this->getJson("/api/publico/publicaciones/{$id}")->assertJsonPath('data.titulo', 'Titulo estable');
        $this->getJson("/api/panel/publicaciones/{$id}")->assertJsonPath('data.operacion_pendiente', null);
    }

    public function test_baja_despublica_sin_eliminar_el_registro(): void
    {
        $id = $this->crearPublicacionPublicada($this->editor, $this->revisor);
        $this->autenticarComo($this->editor, 'Editor');

        $this->postJson("/api/panel/publicaciones/{$id}/solicitar-baja")->assertNoContent();
        $this->getJson("/api/publico/publicaciones/{$id}")->assertOk();

        app(PublicacionesServicio::class)->decidir($this->revisor, $id, TipoDecision::Aprobar);

        $this->getJson("/api/publico/publicaciones/{$id}")->assertNotFound();
        $this->assertSame('despublicada', DB::table('publicacion')->where('id_publicacion', $id)->value(DB::raw('estado::text')));
    }

    public function test_publicacion_programada_a_futuro_no_se_ve_aun(): void
    {
        $futuro = now('America/Lima')->addDays(5)->format('Y-m-d');
        $id = $this->crearPublicacionPublicada($this->editor, $this->revisor, ['fecha' => $futuro]);

        $this->getJson('/api/publico/publicaciones')->assertJsonCount(0, 'data');
        $this->getJson("/api/publico/publicaciones/{$id}")->assertNotFound();
    }

    public function test_validaciones_de_creacion(): void
    {
        $this->autenticarComo($this->editor, 'Editor');

        $this->postJson('/api/panel/publicaciones', ['titulo' => 'abc'])
            ->assertStatus(422)->assertJsonPath('error.codigo', 'VALIDACION')->assertJsonStructure(['error' => ['campos' => ['titulo']]]);

        $this->postJson('/api/panel/publicaciones', ['titulo' => 'Titulo valido', 'fecha_publicacion_programada' => '2020-01-01'])
            ->assertStatus(422)->assertJsonPath('error.codigo', 'REGLA_NEGOCIO')->assertJsonStructure(['error' => ['campos' => ['fecha_publicacion_programada']]]);

        $this->postJson('/api/panel/publicaciones', ['titulo' => 'Titulo valido', 'resumen' => str_repeat('a', 501)])
            ->assertStatus(422)->assertJsonPath('error.codigo', 'VALIDACION');
    }

    public function test_descartar_un_borrador_y_no_dos_veces(): void
    {
        $id = $this->crearPublicacionBorrador($this->editor);
        $this->autenticarComo($this->editor, 'Editor');

        $this->postJson("/api/panel/publicaciones/{$id}/descartar")->assertNoContent();
        $this->postJson("/api/panel/publicaciones/{$id}/descartar")->assertStatus(409);
        $this->putJson("/api/panel/publicaciones/{$id}", ['titulo' => 'Nuevo titulo'])->assertStatus(409);
    }

    public function test_quitar_imagen_en_borrador_borra_el_archivo_huerfano(): void
    {
        $id = $this->crearPublicacionBorrador($this->editor);
        [$idArchivo, $ruta] = $this->adjuntarImagenDirecta($this->editor, $id);
        $this->autenticarComo($this->editor, 'Editor');

        Storage::disk('public')->assertExists($ruta);
        $this->deleteJson("/api/panel/publicaciones/{$id}/imagenes/{$idArchivo}")->assertNoContent();
        Storage::disk('public')->assertMissing($ruta);
        $this->assertSame(0, DB::table('archivo_publicacion')->where('id_publicacion', $id)->count());

        $this->deleteJson("/api/panel/publicaciones/{$id}/imagenes/{$idArchivo}")->assertNotFound();
    }

    public function test_quitar_imagen_de_una_publicada_queda_pendiente_y_conserva_el_archivo(): void
    {
        $id = $this->crearPublicacionBorrador($this->editor);
        [$idArchivo, $ruta] = $this->adjuntarImagenDirecta($this->editor, $id);
        $this->adjuntarImagenDirecta($this->editor, $id);
        app(EjecutorProcedimientos::class)->ejecutar('sp_publicacion_enviar_revision', [$this->editor, $id]);
        app(PublicacionesServicio::class)->decidir($this->revisor, $id, TipoDecision::Aprobar);
        $this->autenticarComo($this->editor, 'Editor');

        $this->deleteJson("/api/panel/publicaciones/{$id}/imagenes/{$idArchivo}")->assertNoContent();

        Storage::disk('public')->assertExists($ruta);
        $this->getJson("/api/publico/publicaciones/{$id}")->assertJsonCount(2, 'data.imagenes');
        $this->getJson("/api/panel/publicaciones/{$id}")->assertJsonPath('data.cambios_pendientes.archivos_quitar.0', $idArchivo);

        app(PublicacionesServicio::class)->decidir($this->revisor, $id, TipoDecision::Aprobar);
        $this->getJson("/api/publico/publicaciones/{$id}")->assertJsonCount(1, 'data.imagenes');
    }

    public function test_maximo_seis_imagenes(): void
    {
        $id = $this->crearPublicacionBorrador($this->editor);
        for ($i = 0; $i < 6; $i++) {
            $this->adjuntarImagenDirecta($this->editor, $id);
        }
        $this->autenticarComo($this->editor, 'Editor');

        $this->postJson("/api/panel/publicaciones/{$id}/imagenes", ['imagen' => $this->imagenPng(600, 400)])
            ->assertStatus(422)->assertJsonPath('error.campos.archivos.0', 'Una publicación admite como máximo 6 archivos.');
    }

    public function test_imagen_invalida_se_rechaza(): void
    {
        $id = $this->crearPublicacionBorrador($this->editor);
        $this->autenticarComo($this->editor, 'Editor');

        $this->postJson("/api/panel/publicaciones/{$id}/imagenes", ['imagen' => UploadedFile::fake()->create('doc.pdf', 20, 'application/pdf')])
            ->assertStatus(422)->assertJsonPath('error.codigo', 'VALIDACION');

        $this->postJson("/api/panel/publicaciones/{$id}/imagenes", ['imagen' => $this->imagenPng(100, 100)])
            ->assertStatus(422)->assertJsonPath('error.codigo', 'REGLA_NEGOCIO')->assertJsonStructure(['error' => ['campos' => ['imagen']]]);

        $this->assertSame([], Storage::disk('public')->allFiles());
    }

    public function test_imagen_se_redimensiona_a_600x400_webp(): void
    {
        if (! extension_loaded('gd')) {
            $this->markTestSkipped('Requiere la extensión php-gd.');
        }

        $id = $this->crearPublicacionBorrador($this->editor);
        $this->autenticarComo($this->editor, 'Editor');

        $url = $this->postJson("/api/panel/publicaciones/{$id}/imagenes", ['imagen' => $this->imagenPng(1200, 900)])
            ->assertCreated()
            ->assertJsonPath('data.ancho_px', 600)
            ->assertJsonPath('data.alto_px', 400)
            ->json('data.url');

        $this->assertStringEndsWith('.webp', $url);
        $ruta = DB::table('archivo_publicacion')->where('id_publicacion', $id)->value('ruta_archivo');
        $this->assertStringStartsWith("publicaciones/{$id}/", $ruta);
        [$ancho, $alto] = getimagesizefromstring(Storage::disk('public')->get($ruta));
        $this->assertSame([600, 400], [$ancho, $alto]);
    }

    public function test_permisos_por_rol(): void
    {
        $this->getJson('/api/panel/publicaciones')->assertUnauthorized();

        $this->autenticarComo($this->crearUsuario('Administrador'), 'Administrador');
        $this->getJson('/api/panel/publicaciones')->assertForbidden()->assertJsonPath('error.codigo', 'ROL_NO_AUTORIZADO');
        $this->postJson('/api/panel/publicaciones', ['titulo' => 'Titulo valido'])->assertForbidden();

        $this->autenticarComo($this->editor, 'Editor');
        $this->getJson('/api/panel/publicaciones')->assertOk();

        $this->autenticarComo($this->revisor, 'Revisor');
        $this->getJson('/api/panel/publicaciones')->assertOk();
    }
}
