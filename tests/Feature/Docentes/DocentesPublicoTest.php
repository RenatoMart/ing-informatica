<?php

namespace Tests\Feature\Docentes;

use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Tests\Concerns\DatosDocentes;
use Tests\Concerns\DatosPublicaciones;
use Tests\TestCase;

class DocentesPublicoTest extends TestCase
{
    use DatosDocentes;
    use DatosPublicaciones;

    public function test_solo_publicados_filtros_y_sin_datos_internos(): void
    {
        Storage::fake('public');
        $this->sembrarRolesPortal();
        Mail::fake();
        $editor = $this->crearUsuario('Editor');
        $revisor = $this->crearUsuario('Revisor');
        $informatica = $this->crearDepartamento($editor);
        $matematica = $this->crearDepartamento($editor);

        $inv = $this->crearDocentePublicado($editor, $revisor, $informatica, [
            'nombres' => 'José', 'apellidos' => 'Núñez Ángeles', 'investigador' => true, 'renacyt' => 'RENACYT Nivel VI',
            'especialidades' => ['Computación gráfica'],
        ]);
        $this->crearDocentePublicado($editor, $revisor, $matematica, ['apellidos' => 'Matemático']);
        $this->crearDocenteBorrador($editor, $informatica);
        $this->crearDocenteEnRevision($editor, $informatica);

        $respuesta = $this->getJson('/api/publico/docentes')->assertOk()->assertJsonCount(2, 'data');
        $this->assertStringContainsString('max-age=60', (string) $respuesta->headers->get('Cache-Control'));
        $this->assertEmpty(array_diff(['id_docente', 'nombres', 'apellidos', 'especialidades'], array_keys($respuesta->json('data.0'))));

        foreach (['id_editor', 'correo', 'estado', 'observaciones_revision', 'cambios_pendientes', 'ruta_fotografia'] as $clave) {
            $this->assertStringNotContainsString("\"{$clave}\"", $respuesta->getContent());
        }

        $this->getJson('/api/publico/docentes?investigador=1')
            ->assertJsonCount(1, 'data')->assertJsonPath('data.0.id_docente', $inv)->assertJsonPath('data.0.categoria_renacyt', 'RENACYT Nivel VI');
        $this->getJson("/api/publico/docentes?id_departamento={$matematica}")->assertJsonCount(1, 'data')->assertJsonPath('data.0.apellidos', 'Matemático');
        $this->getJson('/api/publico/docentes?q=nunez')->assertJsonCount(1, 'data');
        $this->getJson('/api/publico/docentes?q=GRAFICA')->assertJsonCount(1, 'data');
        $this->getJson('/api/publico/docentes?q=inexistente')->assertJsonCount(0, 'data');

        $this->getJson('/api/publico/departamentos')->assertOk()->assertJsonFragment(['id_departamento' => $informatica]);
        $vacio = $this->crearDepartamento($editor);
        $this->assertNotContains($vacio, array_column($this->getJson('/api/publico/departamentos?con_docentes=1')->json('data'), 'id_departamento'));
        $this->assertContains($informatica, array_column($this->getJson('/api/publico/departamentos?con_docentes=1')->json('data'), 'id_departamento'));
        $this->assertSame(['id_departamento', 'nombre'], array_keys($this->getJson('/api/publico/departamentos')->json('data.0')));
    }
}
