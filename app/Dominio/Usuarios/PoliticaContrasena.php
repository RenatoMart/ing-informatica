<?php

namespace App\Dominio\Usuarios;

use App\Dominio\Compartido\Excepciones\ReglaNegocioException;

/**
 * Política de contraseñas del panel (1.4): mínimo 10 caracteres, al menos una letra y un dígito,
 * distinta del correo y de la contraseña actual. Las temporales tienen 12 caracteres sin ambiguos.
 */
final class PoliticaContrasena
{
    public const LONGITUD_MINIMA = 10;

    /** Límite de bcrypt (bytes). */
    public const LONGITUD_MAXIMA = 72;

    public const LONGITUD_TEMPORAL = 12;

    /** Sin `0 O o 1 l I` para que la temporal se pueda dictar o copiar sin errores. */
    private const LETRAS = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';

    private const DIGITOS = '23456789';

    /**
     * @param  bool  $coincideConActual  Resultado de comparar la nueva con el hash actual (lo calcula Aplicación).
     *
     * @throws ReglaNegocioException
     */
    public static function validar(
        string $nueva,
        ?string $correo = null,
        bool $coincideConActual = false,
        string $campo = 'contrasena_nueva',
    ): void {
        if (mb_strlen($nueva) < self::LONGITUD_MINIMA) {
            throw new ReglaNegocioException('La contraseña debe tener al menos '.self::LONGITUD_MINIMA.' caracteres.', $campo);
        }

        if (strlen($nueva) > self::LONGITUD_MAXIMA) {
            throw new ReglaNegocioException('La contraseña no puede superar '.self::LONGITUD_MAXIMA.' caracteres.', $campo);
        }

        if (! preg_match('/\p{L}/u', $nueva) || ! preg_match('/\d/', $nueva)) {
            throw new ReglaNegocioException('La contraseña debe incluir al menos una letra y un dígito.', $campo);
        }

        if ($correo !== null && trim($correo) !== '') {
            $nuevaMinusculas = mb_strtolower($nueva);
            $correoMinusculas = mb_strtolower(trim($correo));
            $usuarioCorreo = strstr($correoMinusculas, '@', true) ?: $correoMinusculas;

            if ($nuevaMinusculas === $correoMinusculas || $nuevaMinusculas === $usuarioCorreo) {
                throw new ReglaNegocioException('La contraseña no puede ser igual a su correo.', $campo);
            }
        }

        if ($coincideConActual) {
            throw new ReglaNegocioException('La nueva contraseña debe ser distinta de la actual.', $campo);
        }
    }

    /**
     * Contraseña temporal de 12 caracteres (letras y dígitos sin ambiguos) que cumple la política.
     */
    public static function generarTemporal(): string
    {
        $alfabeto = self::LETRAS.self::DIGITOS;
        $caracteres = [
            self::LETRAS[random_int(0, strlen(self::LETRAS) - 1)],
            self::DIGITOS[random_int(0, strlen(self::DIGITOS) - 1)],
        ];

        while (count($caracteres) < self::LONGITUD_TEMPORAL) {
            $caracteres[] = $alfabeto[random_int(0, strlen($alfabeto) - 1)];
        }

        for ($i = count($caracteres) - 1; $i > 0; $i--) {
            $j = random_int(0, $i);
            [$caracteres[$i], $caracteres[$j]] = [$caracteres[$j], $caracteres[$i]];
        }

        return implode('', $caracteres);
    }
}
