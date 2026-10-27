<?php

namespace App\Dominio\Compartido;

/**
 * Resultado de un listado paginado. `aArreglo()` produce el formato de la sección 5.1:
 * `{"data": [...], "meta": {"pagina", "por_pagina", "total", "ultima_pagina"}}`.
 *
 * @template T
 */
final readonly class ResultadoPaginado implements Arreglable
{
    /**
     * @param  list<T>  $elementos
     */
    public function __construct(
        public array $elementos,
        public Paginacion $paginacion,
        public int $total,
    ) {}

    public function ultimaPagina(): int
    {
        return max(1, (int) ceil($this->total / $this->paginacion->porPagina));
    }

    /**
     * Transforma cada elemento conservando la paginación.
     *
     * @template U
     *
     * @param  callable(T): U  $transformar
     * @return ResultadoPaginado<U>
     */
    public function mapear(callable $transformar): self
    {
        return new self(array_values(array_map($transformar, $this->elementos)), $this->paginacion, $this->total);
    }

    /**
     * @return array{data: list<mixed>, meta: array{pagina: int, por_pagina: int, total: int, ultima_pagina: int}}
     */
    public function aArreglo(): array
    {
        return [
            'data' => array_map(
                static fn (mixed $elemento): mixed => $elemento instanceof Arreglable ? $elemento->aArreglo() : $elemento,
                $this->elementos,
            ),
            'meta' => [
                'pagina' => $this->paginacion->pagina,
                'por_pagina' => $this->paginacion->porPagina,
                'total' => $this->total,
                'ultima_pagina' => $this->ultimaPagina(),
            ],
        ];
    }
}
