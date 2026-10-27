<?php

namespace App\Persistencia\Compartido;

use InvalidArgumentException;

/**
 * Argumento con conversión explícita para {@see EjecutorProcedimientos}: arreglos de PostgreSQL
 * (`TEXT[]`, `INT[]`) y `JSONB`. Los demás tipos (int, string, bool, null, fechas, enums) se pasan tal cual.
 *
 * Ejemplo: `$sp->escalar('sp_docente_crear', [$idEditor, ..., ArgumentoSql::arregloTexto($especialidades)])`.
 */
final readonly class ArgumentoSql
{
    private function __construct(public string $marcador, public ?string $valor) {}

    /**
     * @param  list<string>|null  $valores
     */
    public static function arregloTexto(?array $valores): self
    {
        return new self('?::text[]', $valores === null ? null : self::literalArreglo(array_map(strval(...), $valores), true));
    }

    /**
     * @param  list<int>|null  $valores
     */
    public static function arregloEntero(?array $valores): self
    {
        return new self('?::int[]', $valores === null ? null : self::literalArreglo(array_map(intval(...), $valores), false));
    }

    public static function json(mixed $valor): self
    {
        return new self('?::jsonb', $valor === null ? null : json_encode($valor, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE));
    }

    /**
     * Conversión explícita a un tipo de PostgreSQL (p. ej. `date`), para resolver ambigüedades.
     */
    public static function conTipo(?string $valor, string $tipo): self
    {
        if (! preg_match('/^[a-z_][a-z0-9_ ]*(\[\])?$/', $tipo)) {
            throw new InvalidArgumentException("Tipo SQL no válido: {$tipo}");
        }

        return new self('?::'.$tipo, $valor);
    }

    /**
     * @param  list<int|string>  $valores
     */
    private static function literalArreglo(array $valores, bool $comillas): string
    {
        $elementos = array_map(
            static fn (int|string $valor): string => $comillas
                ? '"'.str_replace(['\\', '"'], ['\\\\', '\\"'], (string) $valor).'"'
                : (string) $valor,
            $valores,
        );

        return '{'.implode(',', $elementos).'}';
    }
}
