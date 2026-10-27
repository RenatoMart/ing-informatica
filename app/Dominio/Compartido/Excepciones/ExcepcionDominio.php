<?php

namespace App\Dominio\Compartido\Excepciones;

use RuntimeException;
use Throwable;

/**
 * Base de toda excepción de regla de negocio.
 *
 * Cada subclase fija su estado HTTP, su código JSON por defecto (sección 5.1)
 * y el SQLSTATE propio (RNxxx) con el que la lanza PL/pgSQL (sección 4.0).
 * El manejador global de `bootstrap/app.php` la convierte en
 * `{"error": {"codigo", "mensaje", "campos"}}` sin que el controlador intervenga.
 */
abstract class ExcepcionDominio extends RuntimeException
{
    /**
     * @param  string  $mensaje  Texto para el usuario final, en español.
     * @param  string|null  $campo  Campo del formulario al que se asocia el error, si se conoce.
     * @param  string|null  $codigo  Código JSON que reemplaza al de la subclase (p. ej. `CUENTA_INACTIVA`).
     */
    public function __construct(
        string $mensaje,
        private readonly ?string $campo = null,
        private readonly ?string $codigo = null,
        ?Throwable $previa = null,
    ) {
        parent::__construct($mensaje, 0, $previa);
    }

    /** Estado HTTP con el que se responde. */
    abstract public function estadoHttp(): int;

    /** SQLSTATE propio con el que PL/pgSQL lanza esta regla (`RN403`, `RN404`, ...). */
    abstract public function sqlstate(): string;

    /** Código JSON que se usa cuando no se indica otro. */
    abstract protected function codigoPorDefecto(): string;

    /** Código JSON de la sección 5.1. */
    public function codigo(): string
    {
        return $this->codigo ?? $this->codigoPorDefecto();
    }

    public function campo(): ?string
    {
        return $this->campo;
    }

    /**
     * Errores por campo en el formato de la API.
     *
     * @return array<string, list<string>>
     */
    public function campos(): array
    {
        return $this->campo === null ? [] : [$this->campo => [$this->getMessage()]];
    }
}
