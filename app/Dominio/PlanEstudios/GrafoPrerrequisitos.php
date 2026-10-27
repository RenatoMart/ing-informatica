<?php

namespace App\Dominio\PlanEstudios;

/**
 * Grafo de prerrequisitos de un plan, en memoria. Los nodos son códigos de curso.
 * Detecta ciclos con DFS para responder 422 sin ir a la BD.
 */
final class GrafoPrerrequisitos
{
    /**
     * @param  array<string, list<string>>  $requisitos  codigo del curso => códigos de los requeridos.
     * @param  array<string, int>  $ciclos  codigo => ciclo (para las advertencias).
     */
    public function __construct(private array $requisitos = [], private readonly array $ciclos = []) {}

    /**
     * Devuelve una copia con los requeridos del curso reemplazados.
     *
     * @param  list<string>  $requeridos
     */
    public function conRequisitos(string $codigo, array $requeridos): self
    {
        $copia = $this->requisitos;
        $copia[$codigo] = array_values(array_unique($requeridos));

        return new self($copia, $this->ciclos);
    }

    /**
     * Ruta de códigos del primer ciclo hallado (`['A', 'B', 'A']`) o null si no hay.
     *
     * @return list<string>|null
     */
    public function detectarCiclo(): ?array
    {
        $estado = [];
        $pila = [];

        $visitar = function (string $nodo) use (&$visitar, &$estado, &$pila): ?array {
            $estado[$nodo] = 1;
            $pila[] = $nodo;

            foreach ($this->requisitos[$nodo] ?? [] as $requerido) {
                if (($estado[$requerido] ?? 0) === 1) {
                    $inicio = (int) array_search($requerido, $pila, true);

                    return [...array_slice($pila, $inicio), $requerido];
                }

                if (($estado[$requerido] ?? 0) === 0 && ($ruta = $visitar($requerido)) !== null) {
                    return $ruta;
                }
            }

            array_pop($pila);
            $estado[$nodo] = 2;

            return null;
        };

        foreach (array_keys($this->requisitos) as $nodo) {
            if (($estado[$nodo] ?? 0) === 0 && ($ruta = $visitar($nodo)) !== null) {
                return $ruta;
            }
        }

        return null;
    }

    /**
     * Advertencias "el requerido es de un ciclo mayor o igual al del curso".
     *
     * @return list<string>
     */
    public function advertencias(): array
    {
        $avisos = [];

        foreach ($this->requisitos as $codigo => $requeridos) {
            foreach ($requeridos as $requerido) {
                if (isset($this->ciclos[$codigo], $this->ciclos[$requerido]) && $this->ciclos[$requerido] >= $this->ciclos[$codigo]) {
                    $avisos[] = "El requerido {$requerido} es de un ciclo mayor o igual al de {$codigo}.";
                }
            }
        }

        return $avisos;
    }
}
