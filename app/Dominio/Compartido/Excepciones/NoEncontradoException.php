<?php

namespace App\Dominio\Compartido\Excepciones;

/**
 * El registro no existe (404 `NO_ENCONTRADO`, SQLSTATE `RN404`).
 */
class NoEncontradoException extends ExcepcionDominio
{
    public const SQLSTATE = 'RN404';

    public function __construct(
        string $mensaje = 'Registro no encontrado.',
        ?string $campo = null,
        ?string $codigo = null,
        ?\Throwable $previa = null,
    ) {
        parent::__construct($mensaje, $campo, $codigo, $previa);
    }

    public function estadoHttp(): int
    {
        return 404;
    }

    public function sqlstate(): string
    {
        return self::SQLSTATE;
    }

    protected function codigoPorDefecto(): string
    {
        return 'NO_ENCONTRADO';
    }
}
