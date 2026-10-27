<?php

namespace App\Persistencia\Usuarios;

use App\Dominio\Compartido\Paginacion;
use App\Dominio\Compartido\ResultadoPaginado;
use App\Dominio\Usuarios\AccionBitacora;
use App\Persistencia\Compartido\Repositorio;
use Illuminate\Database\Query\Builder;

/**
 * `bitacora_acceso` (3.6): `registrar()` vía `sp_usuario_registrar_acceso` y listado con filtros.
 */
class BitacoraRepositorio extends Repositorio
{
    public function registrar(int $idUsuario, AccionBitacora $accion, ?string $detalle, ?string $ip, ?int $idActor): void
    {
        $this->sp->ejecutar('sp_usuario_registrar_acceso', [$idUsuario, $accion->value, $detalle, $ip, $idActor]);
    }

    /**
     * @param  array{id_usuario?: int|null, accion?: string|null, desde?: string|null, hasta?: string|null}  $filtros  Fechas `Y-m-d` (hora de Lima).
     * @return ResultadoPaginado<array<string, mixed>>
     */
    public function listar(array $filtros, Paginacion $paginacion): ResultadoPaginado
    {
        $consulta = $this->consultaBase()
            ->when($filtros['id_usuario'] ?? null, static fn (Builder $c, int $id): Builder => $c->where(
                static fn (Builder $o): Builder => $o->where('b.id_usuario', $id)->orWhere('b.id_usuario_actor', $id),
            ))
            ->when($filtros['accion'] ?? null, static fn (Builder $c, string $accion): Builder => $c->where('b.accion', $accion))
            ->when($filtros['desde'] ?? null, static fn (Builder $c, string $desde): Builder => $c->where('b.fecha', '>=', $desde.' 00:00:00'))
            ->when($filtros['hasta'] ?? null, static fn (Builder $c, string $hasta): Builder => $c->whereRaw("b.fecha < (?::date + interval '1 day')", [$hasta]));

        return $this->paginador->paginar($consulta, $paginacion, $this->transformar(...));
    }

    /**
     * Últimas entradas en las que el usuario es el afectado.
     *
     * @return list<array<string, mixed>>
     */
    public function ultimasDe(int $idUsuario, int $cantidad = 20): array
    {
        return array_map(
            $this->transformar(...),
            $this->todas($this->consultaBase()->where('b.id_usuario', $idUsuario)->limit($cantidad)),
        );
    }

    private function consultaBase(): Builder
    {
        return $this->tabla('bitacora_acceso as b')
            ->join('usuario as u', 'u.id_usuario', '=', 'b.id_usuario')
            ->leftJoin('usuario as a', 'a.id_usuario', '=', 'b.id_usuario_actor')
            ->select([
                'b.id_bitacora', 'b.id_usuario', 'u.nombres as usuario_nombres', 'u.apellidos as usuario_apellidos',
                'u.correo_institucional as usuario_correo', 'b.id_usuario_actor', 'a.nombres as actor_nombres',
                'a.apellidos as actor_apellidos', 'b.accion', 'b.detalle', 'b.ip', 'b.fecha',
            ])
            ->orderByDesc('b.fecha')
            ->orderByDesc('b.id_bitacora');
    }

    /**
     * @param  array<string, mixed>  $f
     * @return array<string, mixed>
     */
    private function transformar(array $f): array
    {
        return [
            'id_bitacora' => (int) $f['id_bitacora'],
            'usuario' => [
                'id_usuario' => (int) $f['id_usuario'],
                'nombre' => trim($f['usuario_nombres'].' '.$f['usuario_apellidos']),
                'correo_institucional' => $f['usuario_correo'],
            ],
            'actor' => $f['id_usuario_actor'] === null ? null : [
                'id_usuario' => (int) $f['id_usuario_actor'],
                'nombre' => trim($f['actor_nombres'].' '.$f['actor_apellidos']),
            ],
            'accion' => (string) $f['accion'],
            'detalle' => $f['detalle'],
            'ip' => $f['ip'],
            'fecha' => FechasSql::iso($f['fecha']),
        ];
    }
}
