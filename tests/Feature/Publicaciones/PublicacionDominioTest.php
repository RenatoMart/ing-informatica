<?php

namespace Tests\Feature\Publicaciones;

use App\Dominio\Compartido\Excepciones\ReglaNegocioException;
use App\Dominio\Publicaciones\ArchivoPublicacion;
use App\Dominio\Publicaciones\EstadoPublicacion;
use App\Dominio\Publicaciones\Publicacion;
use DateTimeImmutable;
use PHPUnit\Framework\TestCase;

/**
 * Reglas puras de Publicaciones (sin BD).
 */
class PublicacionDominioTest extends TestCase
{
    public function test_titulo_resumen_categoria_y_fecha(): void
    {
        $hoy = new DateTimeImmutable('2026-10-27');
        Publicacion::validarCampos('Titulo valido', 'resumen', 'cat', $hoy, $hoy);

        foreach ([
            ['abcd', null, null, null],
            [str_repeat('a', 201), null, null, null],
            ['Titulo valido', str_repeat('a', 501), null, null],
            ['Titulo valido', null, str_repeat('a', 101), null],
            ['Titulo valido', null, null, new DateTimeImmutable('2026-10-26')],
        ] as [$titulo, $resumen, $categoria, $fecha]) {
            try {
                Publicacion::validarCampos($titulo, $resumen, $categoria, $fecha, $hoy);
                $this->fail('Debió fallar.');
            } catch (ReglaNegocioException $e) {
                $this->assertNotNull($e->campo());
            }
        }
    }

    public function test_limite_de_seis_archivos_y_requisitos_para_enviar(): void
    {
        Publicacion::validarCupoArchivos(5);
        $this->expectException(ReglaNegocioException::class);

        try {
            $sinImagen = new Publicacion(1, 'Titulo', 'r', null, 'c', EstadoPublicacion::Borrador, null);
            $sinImagen->validarParaEnviar();
        } catch (ReglaNegocioException $e) {
            $this->assertSame('archivos', $e->campo());
            Publicacion::validarCupoArchivos(6);
        }
    }

    public function test_archivo_publicacion_valida_ruta_y_dimensiones(): void
    {
        $this->assertSame(['id_archivo' => null, 'ruta_archivo' => 'p/1.webp', 'ancho_px' => 600, 'alto_px' => 400], (new ArchivoPublicacion('p/1.webp'))->aArreglo());
        $this->expectException(ReglaNegocioException::class);
        new ArchivoPublicacion('', 600, 400);
    }
}
