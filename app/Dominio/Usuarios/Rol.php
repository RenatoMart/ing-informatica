<?php

namespace App\Dominio\Usuarios;

use App\Dominio\Compartido\Excepciones\ReglaNegocioException;

/**
 * Roles del diccionario (`rol.nombre`). La Secretaría es un Editor con cargo (3.7).
 * {@see permisos()} implementa la matriz 3.3; el middleware `rol:` de cada grupo de rutas la replica.
 */
enum Rol: string
{
    case Editor = 'Editor';
    case Revisor = 'Revisor';
    case Administrador = 'Administrador';

    /**
     * @throws ReglaNegocioException
     */
    public static function desdeNombre(string $nombre, string $campo = 'rol'): self
    {
        return self::tryFrom($nombre) ?? throw new ReglaNegocioException("Rol no válido: {$nombre}.", $campo);
    }

    public function etiqueta(): string
    {
        return match ($this) {
            self::Editor => 'Editor de contenidos',
            self::Revisor => 'Revisor (Director de Escuela)',
            self::Administrador => 'Administrador del portal',
        };
    }

    /**
     * Matriz de permisos 3.3. El Revisor tiene los del Editor más la revisión y la gestión de solicitudes.
     *
     * @return list<Permiso>
     */
    public function permisos(): array
    {
        $comunes = [Permiso::GestionarSesionPropia, Permiso::VerDashboard, Permiso::VerEstadisticas];
        $edicion = [Permiso::EditarContenido, Permiso::GestionarDepartamentos, Permiso::AtenderConsultas];

        return match ($this) {
            self::Editor => [...$comunes, ...$edicion],
            self::Revisor => [
                ...$comunes,
                ...$edicion,
                Permiso::DecidirRevision,
                Permiso::EstablecerPlanPredeterminado,
                Permiso::RegistrarSolicitudes,
                Permiso::ResolverSolicitudes,
                Permiso::VerUsuarios,
                Permiso::VerBitacora,
            ],
            self::Administrador => [
                ...$comunes,
                Permiso::RegistrarSolicitudes,
                Permiso::EjecutarSolicitudes,
                Permiso::EditarUsuarios,
                Permiso::VerUsuarios,
                Permiso::VerBitacora,
            ],
        };
    }

    public function tienePermiso(Permiso $permiso): bool
    {
        return in_array($permiso, $this->permisos(), true);
    }
}
