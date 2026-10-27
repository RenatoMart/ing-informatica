<?php

namespace App\Persistencia\Compartido;

use Illuminate\Support\Facades\DB;

/**
 * Lecturas de correos de usuarios internos para las notificaciones (revisores activos, editor de un registro).
 */
class DestinatariosRepositorio
{
    /**
     * Correos institucionales de los usuarios activos con el rol indicado.
     *
     * @return list<string>
     */
    public function correosActivosPorRol(string $nombreRol): array
    {
        return DB::table('usuario as u')
            ->join('rol as r', 'r.id_rol', '=', 'u.id_rol')
            ->where('r.nombre', $nombreRol)
            ->where('u.estado', 'activo')
            ->orderBy('u.id_usuario')
            ->pluck('u.correo_institucional')
            ->map(static fn (mixed $correo): string => (string) $correo)
            ->values()
            ->all();
    }

    /** Correo de un usuario activo, o `null` si no existe o está inactivo. */
    public function correoUsuarioActivo(int $idUsuario): ?string
    {
        $correo = DB::table('usuario')
            ->where('id_usuario', $idUsuario)
            ->where('estado', 'activo')
            ->value('correo_institucional');

        return $correo === null ? null : (string) $correo;
    }
}
