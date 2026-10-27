<?php

namespace App\Aplicacion\ConsultasVisitas;

use App\Persistencia\ConsultasVisitas\DashboardRepositorio;

/**
 * KPIs del tablero según el rol (6.3).
 */
class DashboardServicio
{
    public function __construct(private readonly DashboardRepositorio $repositorio) {}

    /**
     * @return array<string, mixed>
     */
    public function paraRol(string $rol, int $idUsuario): array
    {
        return $rol === 'Administrador'
            ? $this->repositorio->paraAdministrador()
            : $this->repositorio->paraEditorRevisor($idUsuario);
    }
}
