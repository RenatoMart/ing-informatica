<?php

namespace App\Persistencia\Docentes;

use App\Dominio\Compartido\Excepciones\NoEncontradoException;
use App\Dominio\Compartido\Paginacion;
use App\Dominio\Compartido\ResultadoPaginado;
use App\Dominio\Docentes\CondicionLaboral;
use App\Dominio\Docentes\Docente;
use App\Dominio\Docentes\Encuadre;
use App\Dominio\Docentes\EstadoDocente;
use App\Persistencia\Compartido\ArgumentoSql;
use App\Persistencia\Compartido\Repositorio;
use Illuminate\Support\Facades\DB;

/**
 * Panel de docentes: lecturas con Query Builder y escrituras solo con `sp_docente_*`.
 */
class DocenteRepositorio extends Repositorio
{
    /**
     * @param  array{estado?: string|null, id_departamento?: int|null, q?: string|null}  $filtros
     * @return ResultadoPaginado<array<string, mixed>>
     */
    public function listar(array $filtros, Paginacion $paginacion): ResultadoPaginado
    {
        $consulta = $this->tabla('docente as d')
            ->join('departamento as dp', 'dp.id_departamento', '=', 'd.id_departamento')
            ->select([
                'd.id_docente', 'd.nombres', 'd.apellidos', 'd.grado_academico', 'd.id_departamento',
                'dp.nombre as departamento', 'd.curso_principal', DB::raw('d.condicion_laboral::text as condicion_laboral'),
                'd.es_investigador', 'd.categoria_renacyt', DB::raw('d.estado::text as estado'),
                'd.operacion_pendiente', 'd.fecha_registro', 'd.ruta_fotografia',
            ])
            ->orderBy('d.apellidos')
            ->orderBy('d.nombres')
            ->orderBy('d.id_docente');

        if (! empty($filtros['estado'])) {
            $consulta->whereRaw('d.estado::text = ?', [$filtros['estado']]);
        }

        if (! empty($filtros['id_departamento'])) {
            $consulta->where('d.id_departamento', (int) $filtros['id_departamento']);
        }

        if (! empty($filtros['q'])) {
            $consulta->whereRaw(
                "translate(lower(d.nombres || ' ' || d.apellidos), 'áéíóúüñ', 'aeiouun') like ?",
                ['%'.BusquedaTexto::patron((string) $filtros['q']).'%'],
            );
        }

        return $this->paginador->paginar($consulta, $paginacion);
    }

    /**
     * @throws NoEncontradoException
     */
    public function obtener(int $id): Docente
    {
        $fila = $this->primeraOFallar(
            $this->tabla('docente as d')
                ->join('departamento as dp', 'dp.id_departamento', '=', 'd.id_departamento')
                ->where('d.id_docente', $id)
                ->select(['d.*', 'dp.nombre as departamento', DB::raw('d.estado::text as estado_texto'), DB::raw('d.condicion_laboral::text as condicion_texto')]),
            'Docente no encontrado.',
        );

        $especialidades = $this->tabla('especialidad_docente')
            ->where('id_docente', $id)->orderBy('especialidad')->pluck('especialidad')
            ->map(static fn (mixed $e): string => (string) $e)->values()->all();

        $cambios = $fila['cambios_pendientes'] === null ? null : json_decode((string) $fila['cambios_pendientes'], true);

        if (is_array($cambios)) {
            unset($cambios['_id_editor']);
        }

        return new Docente(
            (int) $fila['id_docente'],
            (string) $fila['nombres'],
            (string) $fila['apellidos'],
            $fila['grado_academico'],
            (int) $fila['id_departamento'],
            $fila['curso_principal'],
            $fila['condicion_texto'] === null ? null : CondicionLaboral::from((string) $fila['condicion_texto']),
            (bool) $fila['es_investigador'],
            $fila['categoria_renacyt'],
            $especialidades,
            EstadoDocente::from((string) $fila['estado_texto']),
            new Encuadre(
                $fila['encuadre_x'] === null ? Encuadre::DEFECTO_X : (int) $fila['encuadre_x'],
                $fila['encuadre_y'] === null ? Encuadre::DEFECTO_Y : (int) $fila['encuadre_y'],
            ),
            $fila['ruta_fotografia'],
            $fila['operacion_pendiente'],
            $fila['observaciones_revision'],
            is_array($cambios) ? $cambios : null,
            $fila['departamento'],
        );
    }

    /**
     * @return array{0: int, 1: int|null} Editor original y editor del cambio/baja pendiente.
     *
     * @throws NoEncontradoException
     */
    public function idEditorYCambio(int $id): array
    {
        $fila = $this->primeraOFallar(
            $this->tabla('docente')->where('id_docente', $id)
                ->select(['id_editor', DB::raw("(cambios_pendientes ->> '_id_editor')::int as id_editor_cambio")]),
            'Docente no encontrado.',
        );

        return [(int) $fila['id_editor'], $fila['id_editor_cambio'] === null ? null : (int) $fila['id_editor_cambio']];
    }

    /**
     * @param  list<string>  $especialidades
     */
    public function crear(int $idEditor, string $nombres, string $apellidos, ?string $grado, ?int $idDepartamento, ?string $curso, ?string $condicion, bool $esInvestigador, ?string $renacyt, array $especialidades): int
    {
        return (int) $this->sp->escalar('sp_docente_crear', [
            $idEditor, $nombres, $apellidos, $grado, $idDepartamento, $curso, $condicion,
            $esInvestigador, $renacyt, ArgumentoSql::arregloTexto($especialidades),
        ]);
    }

    /**
     * @param  list<string>  $especialidades
     * @return string `directo` o `cambio_pendiente`.
     */
    public function actualizar(int $idEditor, int $id, string $nombres, string $apellidos, ?string $grado, ?int $idDepartamento, ?string $curso, ?string $condicion, bool $esInvestigador, ?string $renacyt, array $especialidades): string
    {
        return (string) $this->sp->escalar('sp_docente_actualizar', [
            $idEditor, $id, $nombres, $apellidos, $grado, $idDepartamento, $curso, $condicion,
            $esInvestigador, $renacyt, ArgumentoSql::arregloTexto($especialidades),
        ]);
    }

    /**
     * @return string|null Ruta anterior que se debe borrar del disco (null si no hay o sigue en uso).
     */
    public function establecerFoto(int $idEditor, int $id, string $ruta, Encuadre $encuadre): ?string
    {
        $anterior = $this->sp->escalar('sp_docente_establecer_foto', [$idEditor, $id, $ruta, $encuadre->x, $encuadre->y]);

        return $anterior === null ? null : (string) $anterior;
    }

    public function establecerEncuadre(int $idEditor, int $id, Encuadre $encuadre): void
    {
        $this->sp->ejecutar('sp_docente_establecer_encuadre', [$idEditor, $id, $encuadre->x, $encuadre->y]);
    }

    public function enviarRevision(int $idEditor, int $id): void
    {
        $this->sp->ejecutar('sp_docente_enviar_revision', [$idEditor, $id]);
    }

    public function solicitarBaja(int $idEditor, int $id): void
    {
        $this->sp->ejecutar('sp_docente_solicitar_baja', [$idEditor, $id]);
    }

    public function reactivar(int $idEditor, int $id): void
    {
        $this->sp->ejecutar('sp_docente_reactivar', [$idEditor, $id]);
    }

    /**
     * @return string Estado nuevo.
     */
    public function decidir(int $idRevisor, int $id, string $decision, ?string $observaciones): string
    {
        return (string) $this->sp->escalar('sp_docente_decidir', [$idRevisor, $id, $decision, $observaciones]);
    }
}
