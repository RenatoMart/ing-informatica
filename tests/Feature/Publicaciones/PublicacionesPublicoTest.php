<?php

namespace Tests\Feature\Publicaciones;

use App\Persistencia\Compartido\EjecutorProcedimientos;
use Illuminate\Support\Facades\Storage;
use Tests\Concerns\DatosPublicaciones;
use Tests\TestCase;

class PublicacionesPublicoTest extends TestCase
{
    use DatosPublicaciones;

    public function test_solo_expone_lo_publicado_y_nunca_datos_internos(): void
    {
        Storage::fake('public');
        $this->sembrarRolesPortal();
        $editor = $this->crearUsuario('Editor');
        $revisor = $this->crearUsuario('Revisor');

        $publicada = $this->crearPublicacionPublicada($editor, $revisor, ['categoria' => 'Eventos']);
        $this->crearPublicacionBorrador($editor);
        $this->crearPublicacionEnRevision($editor);
        $descartada = $this->crearPublicacionBorrador($editor);
        app(EjecutorProcedimientos::class)->ejecutar('sp_publicacion_descartar', [$editor, $descartada]);

        $respuesta = $this->getJson('/api/publico/publicaciones')->assertOk();
        $respuesta->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id_publicacion', $publicada)
            ->assertJsonStructure(['data' => [['id_publicacion', 'titulo', 'resumen', 'categoria', 'fecha_visible', 'imagen_url']], 'meta' => ['pagina', 'por_pagina', 'total', 'ultima_pagina']]);
        $this->assertStringContainsString('/storage/publicaciones/', $respuesta->json('data.0.imagen_url'));
        $this->assertStringContainsString('max-age=60', (string) $respuesta->headers->get('Cache-Control'));

        $detalle = $this->getJson("/api/publico/publicaciones/{$publicada}")->assertOk()
            ->assertJsonStructure(['data' => ['id_publicacion', 'titulo', 'contenido', 'imagenes' => [['id_archivo', 'url', 'ancho_px', 'alto_px']]]]);

        foreach (['id_editor', 'editor', 'correo', 'estado', 'cambios_pendientes', 'observaciones_revision'] as $clave) {
            $this->assertStringNotContainsString("\"{$clave}\"", $detalle->getContent());
            $this->assertStringNotContainsString("\"{$clave}\"", $respuesta->getContent());
        }
    }

    public function test_filtro_por_categoria_y_paginacion(): void
    {
        Storage::fake('public');
        $this->sembrarRolesPortal();
        $editor = $this->crearUsuario('Editor');
        $revisor = $this->crearUsuario('Revisor');
        $this->crearPublicacionPublicada($editor, $revisor, ['categoria' => 'Eventos']);
        $this->crearPublicacionPublicada($editor, $revisor, ['categoria' => 'Convocatorias']);
        $this->crearPublicacionPublicada($editor, $revisor, ['categoria' => 'Eventos']);

        $this->getJson('/api/publico/publicaciones?categoria=Eventos')->assertJsonPath('meta.total', 2);
        $this->getJson('/api/publico/publicaciones?por_pagina=2&pagina=2')
            ->assertJsonCount(1, 'data')->assertJsonPath('meta.ultima_pagina', 2)->assertJsonPath('meta.pagina', 2);
        $this->getJson('/api/publico/publicaciones/999999999')->assertNotFound()->assertJsonPath('error.codigo', 'NO_ENCONTRADO');
    }
}
