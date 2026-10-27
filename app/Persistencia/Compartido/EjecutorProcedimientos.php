<?php

namespace App\Persistencia\Compartido;

use App\Dominio\Compartido\Excepciones\ExcepcionDominio;
use BackedEnum;
use DateTimeInterface;
use Illuminate\Database\ConnectionInterface;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;
use UnitEnum;

/**
 * Invoca las funciones PL/pgSQL `sp_*` (toda escritura pasa por aquí, sección 1.2) y traduce
 * los errores SQL a excepciones de Dominio con {@see TraductorErroresSql}.
 *
 * - `escalar('sp_x', [...])`: `SELECT sp_x(?, ...) AS resultado` y devuelve ese valor (INT, TEXT, NULL...).
 * - `ejecutar('sp_x', [...])`: igual, para funciones `void`.
 * - `fila('sp_x', [...])` / `filas('sp_x', [...])`: `SELECT * FROM sp_x(?, ...)` para funciones `TABLE(...)`.
 *
 * Argumentos: int, string, bool, null, float, `DateTimeInterface` (se envía como fecha ISO), enums respaldados
 * (se envía `->value`) y {@see ArgumentoSql} para arreglos y JSONB.
 */
class EjecutorProcedimientos
{
    public function __construct(private readonly TraductorErroresSql $traductor = new TraductorErroresSql) {}

    /**
     * @param  list<mixed>  $argumentos
     *
     * @throws ExcepcionDominio
     */
    public function escalar(string $funcion, array $argumentos = []): mixed
    {
        [$marcadores, $valores] = $this->preparar($funcion, $argumentos);

        $fila = $this->correr(fn (): ?object => $this->conexion()->selectOne(
            "SELECT {$funcion}({$marcadores}) AS resultado",
            $valores,
        ));

        return $fila?->resultado;
    }

    /**
     * Ejecuta una función que no devuelve nada útil (`RETURNS void`).
     *
     * @param  list<mixed>  $argumentos
     *
     * @throws ExcepcionDominio
     */
    public function ejecutar(string $funcion, array $argumentos = []): void
    {
        $this->escalar($funcion, $argumentos);
    }

    /**
     * Primera fila de una función `RETURNS TABLE(...)` o de un tipo compuesto.
     *
     * @param  list<mixed>  $argumentos
     * @return array<string, mixed>|null
     *
     * @throws ExcepcionDominio
     */
    public function fila(string $funcion, array $argumentos = []): ?array
    {
        return $this->filas($funcion, $argumentos)[0] ?? null;
    }

    /**
     * @param  list<mixed>  $argumentos
     * @return list<array<string, mixed>>
     *
     * @throws ExcepcionDominio
     */
    public function filas(string $funcion, array $argumentos = []): array
    {
        [$marcadores, $valores] = $this->preparar($funcion, $argumentos);

        $filas = $this->correr(fn (): array => $this->conexion()->select(
            "SELECT * FROM {$funcion}({$marcadores})",
            $valores,
        ));

        return array_values(array_map(static fn (object $fila): array => (array) $fila, $filas));
    }

    /**
     * Ejecuta un bloque SQL arbitrario traduciendo sus errores (útil en lecturas con reglas, p. ej. `FOR UPDATE`).
     *
     * @template T
     *
     * @param  callable(): T  $operacion
     * @return T
     *
     * @throws ExcepcionDominio
     */
    public function correr(callable $operacion): mixed
    {
        try {
            return $operacion();
        } catch (QueryException $error) {
            throw $this->traductor->traducir($error) ?? $error;
        }
    }

    protected function conexion(): ConnectionInterface
    {
        return DB::connection();
    }

    /**
     * @param  list<mixed>  $argumentos
     * @return array{0: string, 1: list<mixed>}
     */
    private function preparar(string $funcion, array $argumentos): array
    {
        if (! preg_match('/^sp_[a-z0-9_]+$/', $funcion)) {
            throw new InvalidArgumentException("Nombre de función no permitido: {$funcion}");
        }

        $marcadores = [];
        $valores = [];

        foreach (array_values($argumentos) as $argumento) {
            if ($argumento instanceof ArgumentoSql) {
                $marcadores[] = $argumento->marcador;
                $valores[] = $argumento->valor;

                continue;
            }

            $marcadores[] = '?';
            $valores[] = $this->normalizar($argumento);
        }

        return [implode(', ', $marcadores), $valores];
    }

    private function normalizar(mixed $valor): mixed
    {
        return match (true) {
            $valor === null, is_int($valor), is_string($valor), is_float($valor) => $valor,
            is_bool($valor) => $valor ? 'true' : 'false',
            $valor instanceof BackedEnum => $valor->value,
            $valor instanceof UnitEnum => $valor->name,
            $valor instanceof DateTimeInterface => $valor->format(DateTimeInterface::ATOM),
            default => throw new InvalidArgumentException('Tipo de argumento no soportado: '.get_debug_type($valor).'. Use ArgumentoSql.'),
        };
    }
}
