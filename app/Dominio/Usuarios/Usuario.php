<?php

namespace App\Dominio\Usuarios;

use App\Dominio\Compartido\Arreglable;
use App\Dominio\Compartido\Excepciones\AccesoDenegadoException;

/**
 * Usuario del panel (tabla `usuario` + `rol.nombre`). No expone el hash de la contraseña.
 */
final readonly class Usuario implements Arreglable
{
    public function __construct(
        public int $idUsuario,
        public string $nombres,
        public string $apellidos,
        public string $correo,
        public Rol $rol,
        public EstadoUsuario $estado,
        public ?string $cargo,
        public bool $debeCambiarContrasena,
        public ?string $fechaCreacion = null,
    ) {}

    /**
     * @param  array<string, mixed>  $fila  Columnas de `usuario` más `rol` (nombre del rol).
     */
    public static function desdeFila(array $fila): self
    {
        return new self(
            (int) $fila['id_usuario'],
            (string) $fila['nombres'],
            (string) $fila['apellidos'],
            (string) $fila['correo_institucional'],
            Rol::desdeNombre((string) $fila['rol']),
            EstadoUsuario::from((string) $fila['estado']),
            isset($fila['cargo']) ? (string) $fila['cargo'] : null,
            (bool) $fila['debe_cambiar_contrasena'],
            isset($fila['fecha_creacion']) ? (string) $fila['fecha_creacion'] : null,
        );
    }

    public function estaActivo(): bool
    {
        return $this->estado === EstadoUsuario::Activo;
    }

    public function esAdministrador(): bool
    {
        return $this->rol === Rol::Administrador;
    }

    public function puede(Permiso $permiso): bool
    {
        return $this->estaActivo() && $this->rol->tienePermiso($permiso);
    }

    /**
     * @throws AccesoDenegadoException
     */
    public function exigir(Permiso $permiso): void
    {
        if (! $this->puede($permiso)) {
            throw new AccesoDenegadoException('Su rol no tiene permiso para esta acción.');
        }
    }

    public function nombreCompleto(): string
    {
        return trim($this->nombres.' '.$this->apellidos);
    }

    /**
     * Fila de los listados del panel (`GET /usuarios`).
     *
     * @return array{id_usuario: int, nombres: string, apellidos: string, correo_institucional: string, rol: string, cargo: string|null, estado: string, debe_cambiar_contrasena: bool, fecha_creacion: string|null}
     */
    public function aArreglo(): array
    {
        return [
            'id_usuario' => $this->idUsuario,
            'nombres' => $this->nombres,
            'apellidos' => $this->apellidos,
            'correo_institucional' => $this->correo,
            'rol' => $this->rol->value,
            'cargo' => $this->cargo,
            'estado' => $this->estado->value,
            'debe_cambiar_contrasena' => $this->debeCambiarContrasena,
            'fecha_creacion' => $this->fechaCreacion,
        ];
    }

    /**
     * Perfil de la sesión (`GET /auth/yo` y respuesta del login).
     *
     * @return array{id_usuario: int, nombres: string, apellidos: string, correo_institucional: string, rol: string, rol_etiqueta: string, cargo: string|null, debe_cambiar_contrasena: bool, permisos: list<string>}
     */
    public function perfil(): array
    {
        return [
            'id_usuario' => $this->idUsuario,
            'nombres' => $this->nombres,
            'apellidos' => $this->apellidos,
            'correo_institucional' => $this->correo,
            'rol' => $this->rol->value,
            'rol_etiqueta' => $this->rol->etiqueta(),
            'cargo' => $this->cargo,
            'debe_cambiar_contrasena' => $this->debeCambiarContrasena,
            'permisos' => array_map(static fn (Permiso $permiso): string => $permiso->value, $this->rol->permisos()),
        ];
    }
}
