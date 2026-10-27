<?php

namespace App\Persistencia\Docentes;

use App\Persistencia\Compartido\Repositorio;

/**
 * Departamentos: lectura del panel y de `v_publico_departamentos`, escritura con `sp_departamento_guardar`.
 */
class DepartamentoRepositorio extends Repositorio
{
    /**
     * @return list<array{id_departamento: int, nombre: string, correo: string|null}>
     */
    public function listar(): array
    {
        return $this->todas($this->tabla('departamento')->select(['id_departamento', 'nombre', 'correo'])->orderBy('nombre'));
    }

    /**
     * @return list<array{id_departamento: int, nombre: string}>
     */
    public function listarPublicos(bool $soloConDocentes): array
    {
        $consulta = $this->tabla('v_publico_departamentos')->select(['id_departamento', 'nombre'])->orderBy('nombre');

        if ($soloConDocentes) {
            $consulta->where('total_docentes', '>', 0);
        }

        return $this->todas($consulta);
    }

    /**
     * @param  int|null  $id  `null` crea el departamento.
     * @return int `id_departamento`.
     */
    public function guardar(int $idUsuario, ?int $id, string $nombre, ?string $correo): int
    {
        return (int) $this->sp->escalar('sp_departamento_guardar', [$idUsuario, $id, $nombre, $correo]);
    }
}
