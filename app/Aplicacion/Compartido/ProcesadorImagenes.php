<?php

namespace App\Aplicacion\Compartido;

use App\Dominio\Compartido\Excepciones\ReglaNegocioException;
use finfo;
use Illuminate\Http\UploadedFile;
use Intervention\Image\ImageManager;
use Intervention\Image\Interfaces\ImageInterface;
use Intervention\Image\Interfaces\ImageManagerInterface;

/**
 * Optimiza imágenes con Intervention Image v3 y el driver GD (requiere la extensión `gd`).
 *
 * - Publicación: recorte `cover` a 600×400 y WebP con calidad 82.
 * - Foto de docente: `scaleDown` a 900 px por el lado mayor (sin recorte) y WebP 82.
 *
 * Antes de procesar valida el mime real (fileinfo), el tamaño y las dimensiones mínimas;
 * esa validación no necesita GD.
 */
class ProcesadorImagenes
{
    /**
     * @param  ImageManagerInterface|null  $gestor  Por defecto `ImageManager::gd()`, creado al primer uso.
     */
    public function __construct(private ?ImageManagerInterface $gestor = null) {}

    /**
     * @throws ReglaNegocioException
     */
    public function publicacion(UploadedFile $archivo, string $campo = 'imagen'): ImagenProcesada
    {
        $ancho = (int) config('portal.imagenes.publicacion.ancho', 600);
        $alto = (int) config('portal.imagenes.publicacion.alto', 400);

        $this->validar($archivo, $ancho, $alto, $campo);

        return $this->codificar($this->gestor()->read($archivo->getRealPath())->cover($ancho, $alto));
    }

    /**
     * @throws ReglaNegocioException
     */
    public function fotoDocente(UploadedFile $archivo, string $campo = 'foto'): ImagenProcesada
    {
        $this->validar(
            $archivo,
            (int) config('portal.imagenes.docente.min_ancho', 300),
            (int) config('portal.imagenes.docente.min_alto', 300),
            $campo,
        );

        $lado = (int) config('portal.imagenes.docente.lado_maximo', 900);

        return $this->codificar($this->gestor()->read($archivo->getRealPath())->scaleDown($lado, $lado));
    }

    /**
     * Valida mime real, peso y dimensiones mínimas.
     *
     * @return array{0: int, 1: int} Ancho y alto originales.
     *
     * @throws ReglaNegocioException
     */
    public function validar(UploadedFile $archivo, int $anchoMinimo, int $altoMinimo, string $campo): array
    {
        if (! $archivo->isValid()) {
            throw new ReglaNegocioException('No se pudo recibir la imagen.', $campo);
        }

        /** @var list<string> $permitidos */
        $permitidos = config('portal.imagenes.mimes', ['image/jpeg', 'image/png', 'image/webp']);

        $mimeReal = (new finfo(FILEINFO_MIME_TYPE))->file($archivo->getRealPath());

        if (! in_array($mimeReal, $permitidos, true)) {
            throw new ReglaNegocioException('La imagen debe ser JPG, PNG o WebP.', $campo);
        }

        $maximoKb = (int) config('portal.imagenes.max_kb', 5120);

        if ($archivo->getSize() > $maximoKb * 1024) {
            throw new ReglaNegocioException('La imagen no puede superar '.intdiv($maximoKb, 1024).' MB.', $campo);
        }

        $dimensiones = @getimagesize($archivo->getRealPath());

        if ($dimensiones === false) {
            throw new ReglaNegocioException('El archivo no es una imagen válida.', $campo);
        }

        [$ancho, $alto] = $dimensiones;

        if ($ancho < $anchoMinimo || $alto < $altoMinimo) {
            throw new ReglaNegocioException("La imagen debe medir al menos {$anchoMinimo}×{$altoMinimo} px.", $campo);
        }

        return [$ancho, $alto];
    }

    private function codificar(ImageInterface $imagen): ImagenProcesada
    {
        $calidad = (int) config('portal.imagenes.calidad_webp', 82);

        return new ImagenProcesada(
            $imagen->toWebp(quality: $calidad)->toString(),
            $imagen->width(),
            $imagen->height(),
        );
    }

    private function gestor(): ImageManagerInterface
    {
        return $this->gestor ??= ImageManager::gd();
    }
}
