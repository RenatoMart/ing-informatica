<?php

namespace Tests\Concerns;

use App\Persistencia\Compartido\ArgumentoSql;
use App\Persistencia\Compartido\EjecutorProcedimientos;
use Illuminate\Support\Facades\DB;

/**
 * Datos de pruebas del módulo Docentes, siempre creados con las funciones `sp_`.
 * Se usa junto a {@see CreaDatosPortal} y {@see DatosPublicaciones} (para `autenticarComo` e `imagenPng`).
 */
trait DatosDocentes
{
    /** Crea un departamento con `sp_departamento_guardar` y devuelve su id. */
    protected function crearDepartamento(int $idUsuario, ?string $nombre = null): int
    {
        return (int) app(EjecutorProcedimientos::class)->escalar('sp_departamento_guardar', [
            $idUsuario, null, $nombre ?? 'Departamento '.fake()->unique()->numerify('######'), null,
        ]);
    }

    /**
     * Crea un docente en borrador con `sp_docente_crear`.
     *
     * @param  array{nombres?: string, apellidos?: string, grado?: string|null, curso?: string|null, condicion?: string|null, investigador?: bool, renacyt?: string|null, especialidades?: list<string>}  $extra
     */
    protected function crearDocenteBorrador(int $idEditor, int $idDepartamento, array $extra = []): int
    {
        $investigador = $extra['investigador'] ?? false;

        return (int) app(EjecutorProcedimientos::class)->escalar('sp_docente_crear', [
            $idEditor,
            $extra['nombres'] ?? 'Ana',
            $extra['apellidos'] ?? 'Prueba '.fake()->unique()->numerify('####'),
            array_key_exists('grado', $extra) ? $extra['grado'] : 'Dr.',
            $idDepartamento,
            array_key_exists('curso', $extra) ? $extra['curso'] : 'Algoritmos',
            $extra['condicion'] ?? 'nombrado',
            $investigador,
            $investigador ? ($extra['renacyt'] ?? 'RENACYT Nivel IV') : null,
            ArgumentoSql::arregloTexto($extra['especialidades'] ?? ['Inteligencia artificial']),
        ]);
    }

    protected function crearDocenteEnRevision(int $idEditor, int $idDepartamento, array $extra = []): int
    {
        $id = $this->crearDocenteBorrador($idEditor, $idDepartamento, $extra);
        app(EjecutorProcedimientos::class)->ejecutar('sp_docente_enviar_revision', [$idEditor, $id]);

        return $id;
    }

    /** Docente `publicado` (aprobado por `$idRevisor`, distinto del editor). */
    protected function crearDocentePublicado(int $idEditor, int $idRevisor, int $idDepartamento, array $extra = []): int
    {
        $id = $this->crearDocenteEnRevision($idEditor, $idDepartamento, $extra);
        app(EjecutorProcedimientos::class)->escalar('sp_docente_decidir', [$idRevisor, $id, 'aprobar', null]);

        return $id;
    }

    protected function estadoDocente(int $id): string
    {
        return (string) DB::table('docente')->where('id_docente', $id)->value(DB::raw('estado::text'));
    }
}
