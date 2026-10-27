<?php

namespace App\Persistencia\Usuarios;

use App\Dominio\Compartido\UsuarioAutenticado;
use Illuminate\Auth\Authenticatable as AutenticableLaravel;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/**
 * Único modelo Eloquent del proyecto (1.2 y 3.1): lo usa solo el guard de sesión `web`.
 * Nunca escribe (`$guarded = ['*']`; las escrituras van por `sp_usuario_*`).
 * Cada consulta trae `rol.nombre` como `nombre_rol` con un join, así los middlewares
 * leen rol, estado y `debe_cambiar_contrasena` frescos en cada petición.
 *
 * @property int $id_usuario
 * @property int $id_rol
 * @property string $nombre_rol
 * @property string $estado
 * @property bool $debe_cambiar_contrasena
 * @property string $contrasena_hash
 */
class UsuarioAutenticable extends Model implements Authenticatable, UsuarioAutenticado
{
    use AutenticableLaravel;

    protected $table = 'usuario';

    protected $primaryKey = 'id_usuario';

    public $timestamps = false;

    /** @var list<string> */
    protected $guarded = ['*'];

    /** @var list<string> */
    protected $hidden = ['contrasena_hash'];

    protected static function booted(): void
    {
        static::addGlobalScope('rol', static function (Builder $consulta): void {
            $consulta->join('rol', 'rol.id_rol', '=', 'usuario.id_rol')
                ->select('usuario.*', 'rol.nombre as nombre_rol');
        });
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'id_usuario' => 'integer',
            'id_rol' => 'integer',
            'debe_cambiar_contrasena' => 'boolean',
        ];
    }

    public function getAuthPasswordName(): string
    {
        return 'contrasena_hash';
    }

    /** No hay "recordarme": sin columna de remember token. */
    public function getRememberTokenName(): string
    {
        return '';
    }

    public function idUsuario(): int
    {
        return (int) $this->id_usuario;
    }

    public function nombreRol(): string
    {
        return (string) $this->nombre_rol;
    }

    public function estaActivo(): bool
    {
        return $this->estado === 'activo';
    }

    public function debeCambiarContrasena(): bool
    {
        return (bool) $this->debe_cambiar_contrasena;
    }
}
