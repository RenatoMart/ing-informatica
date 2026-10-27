<?php

namespace App\Aplicacion\Compartido;

use App\Dominio\Compartido\Arreglable;

/**
 * Resultado de {@see VerificadorEnlaces}: `{ok, estado_http}`.
 */
final readonly class EstadoEnlace implements Arreglable
{
    public function __construct(public bool $ok, public ?int $estadoHttp) {}

    /**
     * @return array{ok: bool, estado_http: int|null}
     */
    public function aArreglo(): array
    {
        return ['ok' => $this->ok, 'estado_http' => $this->estadoHttp];
    }
}
