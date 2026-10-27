<?php

namespace Tests\Concerns;

use App\Dominio\Compartido\UsuarioAutenticado;
use App\Persistencia\Compartido\ArgumentoSql;
use App\Persistencia\Compartido\EjecutorProcedimientos;
use Illuminate\Auth\GenericUser;
use Illuminate\Http\Testing\File;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * Datos de pruebas del módulo Publicaciones, siempre creados con las funciones `sp_`.
 * Se usa junto a {@see CreaDatosPortal}.
 */
trait DatosPublicaciones
{
    /** Inserta los tres roles del portal (las migraciones no siembran datos). */
    protected function sembrarRolesPortal(): void
    {
        DB::statement("INSERT INTO rol (nombre, descripcion) VALUES ('Editor', 'E'), ('Revisor', 'R'), ('Administrador', 'A') ON CONFLICT (nombre) DO NOTHING");
    }

    /**
     * Abre sesión (guard web) con un usuario ya creado, sin depender del modelo `UsuarioAutenticable` de B4.
     */
    protected function autenticarComo(int $idUsuario, string $rol): void
    {
        $this->actingAs(new class(['id' => $idUsuario, 'rol' => $rol]) extends GenericUser implements UsuarioAutenticado
        {
            public function idUsuario(): int
            {
                return (int) $this->attributes['id'];
            }

            public function nombreRol(): string
            {
                return (string) $this->attributes['rol'];
            }

            public function estaActivo(): bool
            {
                return true;
            }

            public function debeCambiarContrasena(): bool
            {
                return false;
            }
        });
    }

    /**
     * Crea una publicación en borrador con `sp_publicacion_crear`.
     *
     * @param  array{titulo?: string, resumen?: string|null, contenido?: string|null, categoria?: string|null, fecha?: string|null}  $extra
     */
    protected function crearPublicacionBorrador(int $idEditor, array $extra = []): int
    {
        return (int) app(EjecutorProcedimientos::class)->escalar('sp_publicacion_crear', [
            $idEditor,
            $extra['titulo'] ?? 'Noticia de prueba '.fake()->unique()->numerify('####'),
            array_key_exists('resumen', $extra) ? $extra['resumen'] : 'Resumen de la noticia',
            array_key_exists('contenido', $extra) ? $extra['contenido'] : 'Contenido completo',
            array_key_exists('categoria', $extra) ? $extra['categoria'] : 'Eventos',
            ArgumentoSql::conTipo($extra['fecha'] ?? null, 'date'),
        ]);
    }

    /**
     * Registra una imagen ya "subida" (archivo real en el disco falso) sin pasar por GD.
     *
     * @return array{0: int, 1: string} `id_archivo` y ruta relativa.
     */
    protected function adjuntarImagenDirecta(int $idEditor, int $idPublicacion): array
    {
        $ruta = "publicaciones/{$idPublicacion}/".fake()->uuid().'.webp';
        Storage::disk('public')->put($ruta, 'imagen-de-prueba');

        $idArchivo = (int) app(EjecutorProcedimientos::class)->escalar('sp_publicacion_agregar_archivo', [$idEditor, $idPublicacion, $ruta, 600, 400]);

        return [$idArchivo, $ruta];
    }

    /** Publicación en `en_revision`, lista para decidir. */
    protected function crearPublicacionEnRevision(int $idEditor, array $extra = []): int
    {
        $id = $this->crearPublicacionBorrador($idEditor, $extra);
        $this->adjuntarImagenDirecta($idEditor, $id);
        app(EjecutorProcedimientos::class)->ejecutar('sp_publicacion_enviar_revision', [$idEditor, $id]);

        return $id;
    }

    /** Publicación `publicada` (aprobada por `$idRevisor`, distinto del editor). */
    protected function crearPublicacionPublicada(int $idEditor, int $idRevisor, array $extra = []): int
    {
        $id = $this->crearPublicacionEnRevision($idEditor, $extra);
        app(EjecutorProcedimientos::class)->escalar('sp_publicacion_decidir', [$idRevisor, $id, 'aprobar', null]);

        return $id;
    }

    /** PNG válido de `$ancho`×`$alto` generado sin GD. */
    protected function imagenPng(int $ancho, int $alto, string $nombre = 'imagen.png'): File
    {
        $fila = "\x00".str_repeat("\x20\x40\x80", $ancho);
        $crudo = str_repeat($fila, $alto);
        $trozo = static fn (string $tipo, string $datos): string => pack('N', strlen($datos)).$tipo.$datos.pack('N', crc32($tipo.$datos));

        $contenido = "\x89PNG\r\n\x1a\n"
            .$trozo('IHDR', pack('NNCCCCC', $ancho, $alto, 8, 2, 0, 0, 0))
            .$trozo('IDAT', (string) gzcompress($crudo))
            .$trozo('IEND', '');

        return UploadedFile::fake()->createWithContent($nombre, $contenido);
    }
}
