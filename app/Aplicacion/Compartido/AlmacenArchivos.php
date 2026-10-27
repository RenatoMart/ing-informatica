<?php

namespace App\Aplicacion\Compartido;

use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use InvalidArgumentException;
use RuntimeException;

/**
 * Archivos subidos (sección 5.4). Guarda en el disco `config('filesystems.publico')` (local `public`
 * hoy; S3/R2 mañana) con nombre UUID y devuelve la ruta relativa que se guarda en la BD.
 *
 * Rutas usadas por los módulos: `docentes/{uuid}.webp`, `publicaciones/{id}/{uuid}.webp`,
 * `planes/{id}/{plan|resolucion}-{uuid}.pdf`, `documentos/{uuid}.pdf`.
 */
class AlmacenArchivos
{
    public function disco(): Filesystem
    {
        return Storage::disk((string) config('filesystems.publico', 'public'));
    }

    /**
     * Guarda un archivo subido tal cual (p. ej. un PDF).
     *
     * @return string Ruta relativa.
     */
    public function guardarArchivo(UploadedFile $archivo, string $carpeta, string $extension, ?string $prefijo = null): string
    {
        $ruta = $this->nuevaRuta($carpeta, $extension, $prefijo);
        $flujo = fopen($archivo->getRealPath(), 'rb');

        if ($flujo === false) {
            throw new RuntimeException('No se pudo leer el archivo subido.');
        }

        try {
            $this->escribir($ruta, $flujo);
        } finally {
            if (is_resource($flujo)) {
                fclose($flujo);
            }
        }

        return $ruta;
    }

    /**
     * Guarda contenido ya procesado (p. ej. el WebP de {@see ProcesadorImagenes}).
     *
     * @return string Ruta relativa.
     */
    public function guardarContenido(string $contenido, string $carpeta, string $extension, ?string $prefijo = null): string
    {
        $ruta = $this->nuevaRuta($carpeta, $extension, $prefijo);
        $this->escribir($ruta, $contenido);

        return $ruta;
    }

    /** URL absoluta de una ruta relativa (la que devuelve la API). */
    public function url(?string $ruta): ?string
    {
        if ($ruta === null || $ruta === '') {
            return null;
        }

        if (str_starts_with($ruta, 'http://') || str_starts_with($ruta, 'https://')) {
            return $ruta;
        }

        return Storage::disk((string) config('filesystems.publico', 'public'))->url($ruta);
    }

    public function existe(string $ruta): bool
    {
        return $this->disco()->exists($ruta);
    }

    /**
     * Borra el archivo reemplazado **después del commit** de la transacción en curso (o en el acto si no hay).
     * Solo debe llamarse con rutas de registros en `borrador`/`no_publicado` (la función `sp_` la devuelve).
     */
    public function eliminarSiHuerfano(?string $ruta): void
    {
        if ($ruta === null || $ruta === '' || str_contains($ruta, '..')) {
            return;
        }

        DB::afterCommit(fn (): bool => $this->disco()->delete($ruta));
    }

    /**
     * Borra en el acto un archivo recién guardado cuando la operación de BD falló (limpieza de huérfanos).
     */
    public function descartar(?string $ruta): void
    {
        if ($ruta !== null && $ruta !== '' && ! str_contains($ruta, '..')) {
            $this->disco()->delete($ruta);
        }
    }

    private function nuevaRuta(string $carpeta, string $extension, ?string $prefijo): string
    {
        $carpeta = trim($carpeta, '/');
        $extension = strtolower(ltrim($extension, '.'));

        if ($carpeta === '' || str_contains($carpeta, '..') || ! preg_match('#^[A-Za-z0-9_\-/]+$#', $carpeta)) {
            throw new InvalidArgumentException("Carpeta no permitida: {$carpeta}");
        }

        if (! preg_match('/^[a-z0-9]{1,8}$/', $extension)) {
            throw new InvalidArgumentException("Extensión no permitida: {$extension}");
        }

        if ($prefijo !== null && ! preg_match('/^[a-z0-9_]+$/', $prefijo)) {
            throw new InvalidArgumentException("Prefijo no permitido: {$prefijo}");
        }

        $nombre = ($prefijo !== null ? $prefijo.'-' : '').Str::uuid()->toString();

        return "{$carpeta}/{$nombre}.{$extension}";
    }

    /**
     * @param  string|resource  $contenido
     */
    private function escribir(string $ruta, mixed $contenido): void
    {
        if (! $this->disco()->put($ruta, $contenido, ['visibility' => 'public'])) {
            throw new RuntimeException('No se pudo guardar el archivo.');
        }
    }
}
