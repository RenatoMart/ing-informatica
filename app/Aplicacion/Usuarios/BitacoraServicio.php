<?php

namespace App\Aplicacion\Usuarios;

use App\Dominio\Compartido\Paginacion;
use App\Dominio\Compartido\ResultadoPaginado;
use App\Dominio\Usuarios\Permiso;
use App\Persistencia\Usuarios\BitacoraRepositorio;
use App\Persistencia\Usuarios\UsuarioRepositorio;

/**
 * Consulta paginada de la bitácora de accesos (3.6).
 */
class BitacoraServicio
{
    public function __construct(
        private readonly BitacoraRepositorio $bitacora,
        private readonly UsuarioRepositorio $usuarios,
    ) {}

    /**
     * @param  array{id_usuario?: int|null, accion?: string|null, desde?: string|null, hasta?: string|null}  $filtros
     * @return ResultadoPaginado<array<string, mixed>>
     */
    public function listar(int $idActor, array $filtros, Paginacion $paginacion): ResultadoPaginado
    {
        $this->usuarios->buscar($idActor)->exigir(Permiso::VerBitacora);

        return $this->bitacora->listar($filtros, $paginacion);
    }
}
