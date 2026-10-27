<?php

namespace App\Persistencia\Usuarios;

use App\Dominio\Compartido\Excepciones\NoEncontradoException;
use App\Dominio\Compartido\Paginacion;
use App\Dominio\Compartido\ResultadoPaginado;
use App\Dominio\Usuarios\EstadoUsuario;
use App\Dominio\Usuarios\Rol;
use App\Dominio\Usuarios\Usuario;
use App\Persistencia\Compartido\Repositorio;
use Illuminate\Database\Query\Builder;

/**
 * Lecturas de `usuario` (+ `rol`) con Query Builder y escrituras con `sp_usuario_*`.
 */
class UsuarioRepositorio extends Repositorio
{
    /**
     * @throws NoEncontradoException
     */
    public function buscar(int $idUsuario): Usuario
    {
        return $this->hidratar($this->primeraOFallar(
            $this->consultaBase()->where('u.id_usuario', $idUsuario),
            'Usuario no encontrado.',
        ));
    }

    public function buscarPorCorreo(string $correo): ?Usuario
    {
        $fila = $this->consultaBase()
            ->whereRaw('lower(u.correo_institucional) = ?', [mb_strtolower(trim($correo))])
            ->first();

        return $fila === null ? null : $this->hidratar((array) $fila);
    }

    /** Hash bcrypt actual del usuario (solo para `Hash::check` en Aplicación). */
    public function hashContrasena(int $idUsuario): ?string
    {
        $hash = $this->tabla('usuario')->where('id_usuario', $idUsuario)->value('contrasena_hash');

        return $hash === null ? null : (string) $hash;
    }

    public function existeCorreo(string $correo): bool
    {
        return $this->tabla('usuario')
            ->whereRaw('lower(correo_institucional) = ?', [mb_strtolower(trim($correo))])
            ->exists();
    }

    public function contarAdministradoresActivos(): int
    {
        return (int) $this->sp->escalar('sp_usuario_contar_admins_activos');
    }

    /**
     * @param  array{estado?: string|null, rol?: string|null, q?: string|null}  $filtros
     * @return ResultadoPaginado<array<string, mixed>>
     */
    public function listar(array $filtros, Paginacion $paginacion): ResultadoPaginado
    {
        $consulta = $this->consultaBase()
            ->when($filtros['estado'] ?? null, static fn (Builder $c, string $estado): Builder => $c->where('u.estado', $estado))
            ->when($filtros['rol'] ?? null, static fn (Builder $c, string $rol): Builder => $c->where('r.nombre', $rol))
            ->when($filtros['q'] ?? null, static function (Builder $c, string $texto): Builder {
                $patron = '%'.mb_strtolower(addcslashes(trim($texto), '%_\\')).'%';

                return $c->where(static fn (Builder $o): Builder => $o
                    ->whereRaw('lower(u.nombres) like ?', [$patron])
                    ->orWhereRaw('lower(u.apellidos) like ?', [$patron])
                    ->orWhereRaw('lower(u.correo_institucional) like ?', [$patron])
                    ->orWhereRaw('lower(coalesce(u.cargo, \'\')) like ?', [$patron]));
            })
            ->orderBy('u.apellidos')
            ->orderBy('u.nombres')
            ->orderBy('u.id_usuario');

        return $this->paginador->paginar($consulta, $paginacion, fn (array $fila): array => $this->hidratar($fila)->aArreglo());
    }

    /**
     * @return list<array{id_rol: int, nombre: string, descripcion: string|null}>
     */
    public function roles(): array
    {
        return array_map(static fn (array $fila): array => [
            'id_rol' => (int) $fila['id_rol'],
            'nombre' => (string) $fila['nombre'],
            'descripcion' => $fila['descripcion'] === null ? null : (string) $fila['descripcion'],
        ], $this->todas($this->tabla('rol')->orderBy('id_rol')));
    }

    /**
     * @throws NoEncontradoException
     */
    public function rolPorId(int $idRol): Rol
    {
        $nombre = $this->tabla('rol')->where('id_rol', $idRol)->value('nombre');

        if ($nombre === null) {
            throw new NoEncontradoException('Rol no encontrado.', 'id_rol_solicitado');
        }

        return Rol::desdeNombre((string) $nombre, 'id_rol_solicitado');
    }

    public function crear(int $idAdmin, int $idSolicitud, string $nombres, string $apellidos, string $correo, string $hash, ?string $cargo): int
    {
        return (int) $this->sp->escalar('sp_usuario_crear', [$idAdmin, $idSolicitud, $nombres, $apellidos, $correo, $hash, $cargo]);
    }

    public function crearInicial(string $nombres, string $apellidos, string $correo, string $hash, Rol $rol, ?string $cargo): int
    {
        return (int) $this->sp->escalar('sp_usuario_crear_inicial', [$nombres, $apellidos, $correo, $hash, $rol->value, $cargo]);
    }

    public function cambiarRol(int $idAdmin, int $idSolicitud): void
    {
        $this->sp->ejecutar('sp_usuario_cambiar_rol', [$idAdmin, $idSolicitud]);
    }

    public function desactivar(int $idAdmin, int $idSolicitud, ?string $ip): void
    {
        $this->sp->ejecutar('sp_usuario_desactivar', [$idAdmin, $idSolicitud, $ip]);
    }

    public function actualizarDatos(int $idAdmin, int $idUsuario, string $nombres, string $apellidos, ?string $cargo): void
    {
        $this->sp->ejecutar('sp_usuario_actualizar_datos', [$idAdmin, $idUsuario, $nombres, $apellidos, $cargo]);
    }

    public function cambiarContrasena(int $idUsuario, string $nuevoHash, ?string $ip): void
    {
        $this->sp->ejecutar('sp_usuario_cambiar_contrasena', [$idUsuario, $nuevoHash, $ip]);
    }

    private function consultaBase(): Builder
    {
        return $this->tabla('usuario as u')
            ->join('rol as r', 'r.id_rol', '=', 'u.id_rol')
            ->select([
                'u.id_usuario', 'u.nombres', 'u.apellidos', 'u.correo_institucional', 'u.id_rol',
                'r.nombre as rol', 'u.cargo', 'u.estado', 'u.debe_cambiar_contrasena', 'u.fecha_creacion',
            ]);
    }

    /**
     * @param  array<string, mixed>  $fila
     */
    private function hidratar(array $fila): Usuario
    {
        $fila['fecha_creacion'] = FechasSql::iso($fila['fecha_creacion'] ?? null);
        $fila['estado'] = EstadoUsuario::from((string) $fila['estado'])->value;

        return Usuario::desdeFila($fila);
    }
}
