<?php

namespace App\Persistencia\DocumentosAdmision;

use App\Persistencia\Compartido\Repositorio;

/**
 * Lectura pública de la campaña vigente: solo `v_publico_campana_vigente` (0 o 1 fila).
 */
class AdmisionPublicaRepositorio extends Repositorio
{
    /**
     * @return array{campana: array<string, mixed>, modalidades: list<array<string, mixed>>, cronograma: list<array<string, mixed>>}|null
     */
    public function campanaVigente(): ?array
    {
        $fila = $this->tabla('v_publico_campana_vigente')->first();

        if ($fila === null) {
            return null;
        }

        $fila = (array) $fila;

        return [
            'campana' => [
                'anio' => (int) $fila['anio'],
                'proceso' => $fila['proceso'],
                'fecha_inicio' => $fila['fecha_inicio'],
                'fecha_fin' => $fila['fecha_fin'],
                'url_portal' => $fila['url_portal'],
                'url_estadisticas' => $fila['url_estadisticas'],
            ],
            'modalidades' => $this->decodificar($fila['modalidades']),
            'cronograma' => $this->decodificar($fila['cronograma']),
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function decodificar(mixed $json): array
    {
        $datos = is_string($json) ? json_decode($json, true, 512, JSON_THROW_ON_ERROR) : $json;

        return is_array($datos) ? array_values($datos) : [];
    }
}
