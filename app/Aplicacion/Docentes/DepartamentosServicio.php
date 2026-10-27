<?php

namespace App\Aplicacion\Docentes;

use App\Persistencia\Docentes\DepartamentoRepositorio;
use Illuminate\Support\Facades\DB;

/**
 * Listar y guardar departamentos (panel).
 */
class DepartamentosServicio
{
    public function __construct(private readonly DepartamentoRepositorio $repositorio) {}

    /**
     * @return list<array{id_departamento: int, nombre: string, correo: string|null}>
     */
    public function listar(): array
    {
        return $this->repositorio->listar();
    }

    /**
     * @return int `id_departamento` creado.
     */
    public function crear(int $idUsuario, string $nombre, ?string $correo): int
    {
        return DB::transaction(fn (): int => $this->repositorio->guardar($idUsuario, null, $nombre, $correo));
    }

    public function actualizar(int $idUsuario, int $id, string $nombre, ?string $correo): void
    {
        DB::transaction(fn () => $this->repositorio->guardar($idUsuario, $id, $nombre, $correo));
    }
}
