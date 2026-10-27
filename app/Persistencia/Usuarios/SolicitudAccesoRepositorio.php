<?php

namespace App\Persistencia\Usuarios;

use App\Dominio\Compartido\Excepciones\NoEncontradoException;
use App\Dominio\Compartido\Paginacion;
use App\Dominio\Compartido\ResultadoPaginado;
use App\Dominio\Usuarios\EstadoSolicitud;
use App\Dominio\Usuarios\SolicitudAcceso;
use App\Dominio\Usuarios\TipoSolicitud;
use App\Persistencia\Compartido\Repositorio;
use Illuminate\Database\Query\Builder;

/**
 * `solicitud_acceso`: listado con Query Builder y escrituras con `sp_solicitud_registrar` / `sp_solicitud_resolver`.
 */
class SolicitudAccesoRepositorio extends Repositorio
{
    /**
     * @throws NoEncontradoException
     */
    public function buscar(int $idSolicitud): SolicitudAcceso
    {
        $fila = $this->primeraOFallar(
            $this->tabla('solicitud_acceso')->where('id_solicitud', $idSolicitud),
            'Solicitud no encontrada.',
        );

        return new SolicitudAcceso(
            (int) $fila['id_solicitud'],
            (string) $fila['solicitante_nombre'],
            TipoSolicitud::from((string) $fila['tipo_solicitud']),
            $fila['id_rol_solicitado'] === null ? null : (int) $fila['id_rol_solicitado'],
            $fila['motivo'] === null ? null : (string) $fila['motivo'],
            EstadoSolicitud::from((string) $fila['estado']),
            $fila['correo_solicitado'] === null ? null : (string) $fila['correo_solicitado'],
            $fila['id_usuario_objetivo'] === null ? null : (int) $fila['id_usuario_objetivo'],
            $fila['fecha_ejecucion'] !== null,
        );
    }

    /**
     * @param  array{estado?: string|null, tipo?: string|null}  $filtros
     * @return ResultadoPaginado<array<string, mixed>>
     */
    public function listar(array $filtros, Paginacion $paginacion): ResultadoPaginado
    {
        $consulta = $this->tabla('solicitud_acceso as s')
            ->join('rol as r', 'r.id_rol', '=', 's.id_rol_solicitado')
            ->leftJoin('usuario as o', 'o.id_usuario', '=', 's.id_usuario_objetivo')
            ->leftJoin('usuario as d', 'd.id_usuario', '=', 's.id_director_autoriza')
            ->select([
                's.id_solicitud', 's.solicitante_nombre', 's.tipo_solicitud', 's.id_rol_solicitado',
                'r.nombre as rol_solicitado', 's.motivo', 's.estado', 's.correo_solicitado', 's.id_usuario_objetivo',
                'o.nombres as objetivo_nombres', 'o.apellidos as objetivo_apellidos', 'o.correo_institucional as objetivo_correo',
                's.id_director_autoriza', 'd.nombres as director_nombres', 'd.apellidos as director_apellidos',
                's.observacion_resolucion', 's.fecha_solicitud', 's.fecha_resolucion', 's.fecha_ejecucion',
            ])
            ->when($filtros['estado'] ?? null, static fn (Builder $c, string $estado): Builder => $c->where('s.estado', $estado))
            ->when($filtros['tipo'] ?? null, static fn (Builder $c, string $tipo): Builder => $c->where('s.tipo_solicitud', $tipo))
            ->orderByDesc('s.fecha_solicitud')
            ->orderByDesc('s.id_solicitud');

        return $this->paginador->paginar($consulta, $paginacion, static fn (array $f): array => [
            'id_solicitud' => (int) $f['id_solicitud'],
            'solicitante_nombre' => (string) $f['solicitante_nombre'],
            'tipo_solicitud' => (string) $f['tipo_solicitud'],
            'id_rol_solicitado' => (int) $f['id_rol_solicitado'],
            'rol_solicitado' => (string) $f['rol_solicitado'],
            'motivo' => $f['motivo'],
            'estado' => (string) $f['estado'],
            'correo_solicitado' => $f['correo_solicitado'],
            'id_usuario_objetivo' => $f['id_usuario_objetivo'] === null ? null : (int) $f['id_usuario_objetivo'],
            'usuario_objetivo' => $f['id_usuario_objetivo'] === null ? null : [
                'id_usuario' => (int) $f['id_usuario_objetivo'],
                'nombre' => trim($f['objetivo_nombres'].' '.$f['objetivo_apellidos']),
                'correo_institucional' => $f['objetivo_correo'],
            ],
            'id_director_autoriza' => $f['id_director_autoriza'] === null ? null : (int) $f['id_director_autoriza'],
            'director_autoriza' => $f['id_director_autoriza'] === null ? null : trim($f['director_nombres'].' '.$f['director_apellidos']),
            'observacion_resolucion' => $f['observacion_resolucion'],
            'fecha_solicitud' => FechasSql::iso($f['fecha_solicitud']),
            'fecha_resolucion' => FechasSql::iso($f['fecha_resolucion']),
            'fecha_ejecucion' => FechasSql::iso($f['fecha_ejecucion']),
            'ejecutada' => $f['fecha_ejecucion'] !== null,
        ]);
    }

    public function registrar(int $idActor, SolicitudAcceso $solicitud): int
    {
        return (int) $this->sp->escalar('sp_solicitud_registrar', [
            $idActor,
            $solicitud->solicitanteNombre,
            $solicitud->tipo->value,
            $solicitud->idRolSolicitado,
            $solicitud->motivo,
            $solicitud->correoSolicitado,
            $solicitud->idUsuarioObjetivo,
        ]);
    }

    public function resolver(int $idRevisor, int $idSolicitud, bool $autorizar, ?string $observacion): void
    {
        $this->sp->ejecutar('sp_solicitud_resolver', [$idRevisor, $idSolicitud, $autorizar, $observacion]);
    }
}
