<?php

namespace App\Persistencia\Revision;

use App\Dominio\Compartido\Excepciones\NoEncontradoException;
use App\Dominio\Revision\EntidadRevisable;
use App\Dominio\Revision\TipoDecision;
use App\Persistencia\Compartido\Repositorio;
use Illuminate\Support\Facades\DB;

/**
 * Lee la bandeja (`v_rev_pendientes`), el historial y delega la decisión en `sp_<entidad>_decidir`.
 */
class RevisionRepositorio extends Repositorio
{
    /**
     * @return list<array{entidad: string, id_registro: int, titulo: string, operacion: string, editor: string, id_editor: int}>
     */
    public function pendientes(): array
    {
        return array_map(static fn (array $f): array => [
            'entidad' => (string) $f['entidad'],
            'id_registro' => (int) $f['id_registro'],
            'titulo' => (string) $f['titulo'],
            'operacion' => (string) $f['operacion'],
            'editor' => (string) $f['editor'],
            'id_editor' => (int) $f['id_editor'],
        ], $this->todas($this->tabla('v_rev_pendientes')->orderBy('entidad')->orderBy('id_registro')));
    }

    /**
     * Editor, editor del cambio pendiente y título del registro.
     *
     * @return array{id_editor: int, id_editor_cambio: ?int, titulo: string}
     *
     * @throws NoEncontradoException
     */
    public function contexto(EntidadRevisable $entidad, int $id): array
    {
        $existe = $this->tabla($entidad->tabla())->where($entidad->clavePrimaria(), $id);
        $columnas = $entidad->admiteOperacionPendiente()
            ? ['id_editor', DB::raw("(cambios_pendientes->>'_id_editor')::int AS id_editor_cambio")]
            : ['id_editor'];
        $fila = $this->primeraOFallar($existe->select($columnas), 'Registro no encontrado.');

        $titulo = $this->tabla('v_rev_pendientes')->where('entidad', $entidad->value)->where('id_registro', $id)->value('titulo');

        return [
            'id_editor' => (int) $fila['id_editor'],
            'id_editor_cambio' => isset($fila['id_editor_cambio']) ? (int) $fila['id_editor_cambio'] : null,
            'titulo' => $titulo === null ? $entidad->etiqueta().' #'.$id : (string) $titulo,
        ];
    }

    /** Aplica la decisión y devuelve el estado nuevo. */
    public function decidir(EntidadRevisable $entidad, int $id, TipoDecision $decision, int $idRevisor, ?string $observaciones, ?bool $comoVigente): string
    {
        $args = [$idRevisor, $id, $decision->value, $observaciones];
        if ($entidad === EntidadRevisable::Plan) {
            $args[] = $comoVigente ?? true;
        }

        return (string) $this->sp->escalar($entidad->funcionDecidir(), $args);
    }

    /**
     * @return list<array{accion: string, estado_anterior: ?string, estado_nuevo: string, usuario: ?string, observaciones: ?string, fecha: string}>
     *
     * @throws NoEncontradoException
     */
    public function historial(EntidadRevisable $entidad, int $id): array
    {
        $this->contexto($entidad, $id);

        $consulta = $this->tabla('historial_revision as h')
            ->leftJoin('usuario as u', 'u.id_usuario', '=', 'h.id_usuario')
            ->where('h.entidad', $entidad->value)->where('h.id_registro', $id)
            ->orderBy('h.fecha')->orderBy('h.id_historial')
            ->selectRaw("h.accion, h.estado_anterior, h.estado_nuevo, trim(u.nombres || ' ' || u.apellidos) AS usuario, h.observaciones, h.fecha");

        return array_map(static fn (array $f): array => [
            'accion' => (string) $f['accion'],
            'estado_anterior' => $f['estado_anterior'],
            'estado_nuevo' => (string) $f['estado_nuevo'],
            'usuario' => $f['usuario'],
            'observaciones' => $f['observaciones'],
            'fecha' => (string) $f['fecha'],
        ], $this->todas($consulta));
    }
}
