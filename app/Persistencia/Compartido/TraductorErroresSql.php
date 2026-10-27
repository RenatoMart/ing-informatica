<?php

namespace App\Persistencia\Compartido;

use App\Dominio\Compartido\Excepciones\AccesoDenegadoException;
use App\Dominio\Compartido\Excepciones\ConflictoException;
use App\Dominio\Compartido\Excepciones\ExcepcionDominio;
use App\Dominio\Compartido\Excepciones\NoEncontradoException;
use App\Dominio\Compartido\Excepciones\ReglaNegocioException;
use App\Dominio\Compartido\Excepciones\TransicionInvalidaException;
use Illuminate\Database\QueryException;
use PDOException;

/**
 * Traduce los errores de PostgreSQL a excepciones de Dominio (tabla de la sección 4.0).
 *
 * | SQLSTATE        | Excepción                    |
 * |-----------------|------------------------------|
 * | RN403           | AccesoDenegadoException      |
 * | RN404           | NoEncontradoException        |
 * | RN409           | TransicionInvalidaException  |
 * | RN422           | ReglaNegocioException        |
 * | 23505           | ConflictoException           |
 * | 23514, 23503    | ReglaNegocioException        |
 *
 * El mensaje es la primera línea de `errorInfo[2]` sin el prefijo `ERROR:  ` y el campo es la línea `DETAIL:  `.
 */
final class TraductorErroresSql
{
    /**
     * Devuelve la excepción de Dominio equivalente o `null` si el error no es de negocio
     * (en ese caso el llamador relanza el original y termina en 500).
     */
    public function traducir(QueryException $error): ?ExcepcionDominio
    {
        $sqlstate = $this->sqlstate($error);
        [$mensaje, $detalle] = $this->mensajeYDetalle($error);

        return match ($sqlstate) {
            AccesoDenegadoException::SQLSTATE => new AccesoDenegadoException($mensaje ?? 'No tiene permiso para esta acción.', $this->campoDesdeDetalle($detalle), null, $error),
            NoEncontradoException::SQLSTATE => new NoEncontradoException($mensaje ?? 'Registro no encontrado.', $this->campoDesdeDetalle($detalle), null, $error),
            TransicionInvalidaException::SQLSTATE => new TransicionInvalidaException($mensaje ?? 'Acción no permitida en el estado actual.', $this->campoDesdeDetalle($detalle), null, $error),
            ReglaNegocioException::SQLSTATE => new ReglaNegocioException($mensaje ?? 'Los datos no cumplen una regla de negocio.', $this->campoDesdeDetalle($detalle), null, $error),
            '23505' => new ConflictoException('Ya existe un registro con esos datos.', $this->campoDesdeClave($detalle), null, $error),
            '23514' => new ReglaNegocioException('Los datos no cumplen una regla de integridad.', null, null, $error),
            '23503' => new ReglaNegocioException('El registro relacionado no existe o está en uso.', $this->campoDesdeClave($detalle), null, $error),
            default => null,
        };
    }

    private function sqlstate(QueryException $error): ?string
    {
        $previa = $error->getPrevious();

        if ($previa instanceof PDOException && is_array($previa->errorInfo) && isset($previa->errorInfo[0])) {
            return (string) $previa->errorInfo[0];
        }

        $codigo = $error->getCode();

        return is_string($codigo) && $codigo !== '' ? $codigo : null;
    }

    /**
     * @return array{0: string|null, 1: string|null}
     */
    private function mensajeYDetalle(QueryException $error): array
    {
        $previa = $error->getPrevious();
        $texto = $previa instanceof PDOException && is_array($previa->errorInfo) && isset($previa->errorInfo[2])
            ? (string) $previa->errorInfo[2]
            : null;

        if ($texto === null || trim($texto) === '') {
            return [null, null];
        }

        $mensaje = null;
        $detalle = null;

        foreach (preg_split('/\R/', $texto) ?: [] as $linea) {
            if ($mensaje === null && trim($linea) !== '') {
                $mensaje = trim((string) preg_replace('/^ERROR:\s*/', '', $linea));

                continue;
            }

            if (str_starts_with($linea, 'DETAIL:')) {
                $detalle = trim(substr($linea, strlen('DETAIL:')));
            }
        }

        return [$mensaje === '' ? null : $mensaje, $detalle === '' ? null : $detalle];
    }

    /** En las excepciones RNxxx el DETAIL es directamente el nombre del campo. */
    private function campoDesdeDetalle(?string $detalle): ?string
    {
        if ($detalle === null || ! preg_match('/^[A-Za-z0-9_.\[\]]+$/', $detalle)) {
            return null;
        }

        return $detalle;
    }

    /**
     * En 23505/23503 el DETAIL es `Key (id_plan, codigo)=(1, X) already exists.`: se toma la última columna.
     */
    private function campoDesdeClave(?string $detalle): ?string
    {
        if ($detalle === null || ! preg_match('/\(([^)]+)\)=/', $detalle, $coincidencias)) {
            return null;
        }

        $columnas = array_map('trim', explode(',', $coincidencias[1]));

        return end($columnas) ?: null;
    }
}
