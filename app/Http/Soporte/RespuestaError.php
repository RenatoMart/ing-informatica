<?php

namespace App\Http\Soporte;

use Illuminate\Http\JsonResponse;

/**
 * Único constructor del cuerpo de error de la API (sección 5.1):
 * `{"error": {"codigo": "...", "mensaje": "...", "campos": {"campo": ["..."]}}}`.
 * `campos` solo aparece cuando hay errores por campo.
 */
final class RespuestaError
{
    /**
     * @param  array<string, list<string>|string>  $campos
     * @param  array<string, string>  $cabeceras
     */
    public static function json(int $estado, string $codigo, string $mensaje, array $campos = [], array $cabeceras = []): JsonResponse
    {
        $error = ['codigo' => $codigo, 'mensaje' => $mensaje];

        if ($campos !== []) {
            $error['campos'] = array_map(
                static fn (array|string $mensajes): array => array_values((array) $mensajes),
                $campos,
            );
        }

        return new JsonResponse(['error' => $error], $estado, $cabeceras);
    }
}
