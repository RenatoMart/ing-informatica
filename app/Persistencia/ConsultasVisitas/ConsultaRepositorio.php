<?php

namespace App\Persistencia\ConsultasVisitas;

use App\Dominio\Compartido\Paginacion;
use App\Dominio\Compartido\ResultadoPaginado;
use App\Dominio\ConsultasVisitas\ConsultaContacto;
use App\Persistencia\Compartido\Repositorio;
use App\Persistencia\Docentes\BusquedaTexto;
use Illuminate\Support\Facades\DB;

/**
 * Consultas de contacto: escritura vía `sp_consulta_*` y lectura con Query Builder.
 */
class ConsultaRepositorio extends Repositorio
{
    private const DIAS_HABILES = "sp_dias_habiles(CASE WHEN c.estado = 'en_atencion' THEN COALESCE(c.fecha_clasificacion, c.fecha_recepcion) ELSE c.fecha_recepcion END, now())";

    public function registrar(ConsultaContacto $consulta): int
    {
        return (int) $this->sp->escalar('sp_consulta_registrar', [$consulta->nombre, $consulta->correo, $consulta->asunto, $consulta->mensaje]);
    }

    public function clasificar(int $idEditor, int $id, string $destino, ?int $idDepartamento, ?string $nota): string
    {
        return (string) $this->sp->escalar('sp_consulta_clasificar', [$idEditor, $id, $destino, $idDepartamento, $nota]);
    }

    public function responder(int $idEditor, int $id, string $respuesta): void
    {
        $this->sp->ejecutar('sp_consulta_responder', [$idEditor, $id, $respuesta]);
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function vencidas(): array
    {
        return $this->sp->filas('sp_consulta_vencidas');
    }

    /**
     * @param  array{estado?: ?string, vencidas?: bool, q?: ?string}  $filtros
     */
    public function listar(array $filtros, Paginacion $paginacion): ResultadoPaginado
    {
        $consulta = $this->tabla('consulta_contacto as c')
            ->leftJoin('departamento as d', 'd.id_departamento', '=', 'c.id_departamento_responsable')
            ->selectRaw('c.id_consulta, c.nombre_visitante, c.correo_visitante, c.asunto, c.estado::text AS estado, c.fecha_recepcion, c.fecha_respuesta, d.nombre AS departamento, '.self::DIAS_HABILES.' AS dias_habiles')
            ->orderByDesc('c.fecha_recepcion')->orderByDesc('c.id_consulta');

        if (! empty($filtros['estado'])) {
            $consulta->where('c.estado', $filtros['estado']);
        }
        if (! empty($filtros['vencidas'])) {
            $consulta->whereIn('c.id_consulta', array_column($this->vencidas(), 'id_consulta') ?: [0]);
        }
        if (! empty($filtros['q'])) {
            $patron = '%'.BusquedaTexto::patron((string) $filtros['q']).'%';
            $consulta->whereRaw("translate(lower(c.nombre_visitante || ' ' || c.correo_visitante || ' ' || COALESCE(c.asunto, '') || ' ' || c.mensaje), 'áéíóúüñ', 'aeiouun') LIKE ?", [$patron]);
        }

        return $this->paginador->paginar($consulta, $paginacion, static function (array $f): array {
            $plazo = match ($f['estado']) {
                'recibida' => 2,
                'en_atencion' => 5,
                default => null,
            };
            $f['id_consulta'] = (int) $f['id_consulta'];
            $f['dias_habiles'] = (int) $f['dias_habiles'];
            $f['vencida'] = $plazo !== null && $f['dias_habiles'] > $plazo;

            return $f;
        });
    }

    /**
     * @return array<string, mixed>
     */
    public function detalle(int $id): array
    {
        $fila = $this->primeraOFallar(
            $this->tabla('consulta_contacto as c')
                ->leftJoin('departamento as d', 'd.id_departamento', '=', 'c.id_departamento_responsable')
                ->leftJoin('usuario as u', 'u.id_usuario', '=', 'c.id_editor_clasifica')
                ->where('c.id_consulta', $id)
                ->selectRaw("c.id_consulta, c.nombre_visitante, c.correo_visitante, c.asunto, c.mensaje, c.estado::text AS estado, c.id_departamento_responsable, d.nombre AS departamento, trim(u.nombres || ' ' || u.apellidos) AS clasificada_por, c.respuesta, c.fecha_recepcion, c.fecha_clasificacion, c.fecha_respuesta, ".self::DIAS_HABILES.' AS dias_habiles'),
            'Consulta no encontrada.',
        );
        $fila['dias_habiles'] = (int) $fila['dias_habiles'];

        return $fila;
    }

    /**
     * Correo y datos mínimos de la consulta para los avisos al visitante.
     *
     * @return array{nombre: string, correo: string, asunto: ?string, mensaje: string}
     */
    public function contacto(int $id): array
    {
        $f = $this->primeraOFallar($this->tabla('consulta_contacto')->where('id_consulta', $id)->selectRaw('nombre_visitante AS nombre, correo_visitante AS correo, asunto, mensaje'), 'Consulta no encontrada.');

        return ['nombre' => (string) $f['nombre'], 'correo' => (string) $f['correo'], 'asunto' => $f['asunto'], 'mensaje' => (string) $f['mensaje']];
    }

    /**
     * @return list<string>
     */
    public function departamentoCorreo(?int $idDepartamento): array
    {
        if ($idDepartamento === null) {
            return [];
        }
        $correo = DB::table('departamento')->where('id_departamento', $idDepartamento)->value('correo');

        return $correo === null ? [] : [(string) $correo];
    }
}
