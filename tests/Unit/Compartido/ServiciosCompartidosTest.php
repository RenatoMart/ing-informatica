<?php

namespace Tests\Unit\Compartido;

use App\Aplicacion\Compartido\AlmacenArchivos;
use App\Aplicacion\Compartido\Correos\ContenidoEnRevisionMail;
use App\Aplicacion\Compartido\Correos\DecisionRevisionMail;
use App\Aplicacion\Compartido\NotificadorRevision;
use App\Aplicacion\Compartido\ProcesadorImagenes;
use App\Aplicacion\Compartido\VerificadorEnlaces;
use App\Dominio\Compartido\Excepciones\ReglaNegocioException;
use App\Dominio\Revision\EntidadRevisable;
use App\Dominio\Revision\TipoDecision;
use App\Persistencia\Compartido\DestinatariosRepositorio;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Request as PeticionHttp;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\Interfaces\EncodedImageInterface;
use Intervention\Image\Interfaces\ImageInterface;
use Intervention\Image\Interfaces\ImageManagerInterface;
use InvalidArgumentException;
use Mockery;
use PHPUnit\Framework\Attributes\RequiresPhpExtension;
use RuntimeException;
use Tests\TestCaseSinBaseDatos;

class ServiciosCompartidosTest extends TestCaseSinBaseDatos
{
    /**
     * PNG mínimo con la cabecera IHDR indicada: basta para fileinfo y getimagesize, sin necesitar GD.
     */
    private static function png(int $ancho, int $alto): string
    {
        $fragmento = static fn (string $tipo, string $datos): string => pack('N', strlen($datos)).$tipo.$datos.pack('N', crc32($tipo.$datos));

        return "\x89PNG\r\n\x1a\n"
            .$fragmento('IHDR', pack('NNCCCCC', $ancho, $alto, 8, 2, 0, 0, 0))
            .$fragmento('IDAT', (string) gzcompress(''))
            .$fragmento('IEND', '');
    }

    public function test_almacen_guarda_con_uuid_en_el_disco_publico_y_devuelve_url(): void
    {
        Storage::fake('public');
        $almacen = new AlmacenArchivos;

        $ruta = $almacen->guardarContenido('webp', 'publicaciones/12', 'webp');
        $pdf = $almacen->guardarArchivo(UploadedFile::fake()->createWithContent('plan.pdf', '%PDF-1.4'), 'planes/3', 'pdf', 'resolucion');

        $this->assertMatchesRegularExpression('#^publicaciones/12/[0-9a-f-]{36}\.webp$#', $ruta);
        $this->assertMatchesRegularExpression('#^planes/3/resolucion-[0-9a-f-]{36}\.pdf$#', $pdf);
        Storage::disk('public')->assertExists([$ruta, $pdf]);
        $this->assertStringEndsWith('/storage/'.$ruta, (string) $almacen->url($ruta));
        $this->assertNull($almacen->url(null));
    }

    public function test_almacen_usa_el_disco_configurado(): void
    {
        Storage::fake('r2');
        config(['filesystems.publico' => 'r2']);

        $ruta = (new AlmacenArchivos)->guardarContenido('x', 'documentos', 'pdf');

        Storage::disk('r2')->assertExists($ruta);
    }

    public function test_almacen_borra_el_huerfano_despues_del_commit(): void
    {
        Storage::fake('public');
        Storage::disk('public')->put('docentes/vieja.webp', 'x');
        DB::shouldReceive('afterCommit')->once()->andReturnUsing(fn (callable $callback): mixed => $callback());

        (new AlmacenArchivos)->eliminarSiHuerfano('docentes/vieja.webp');

        Storage::disk('public')->assertMissing('docentes/vieja.webp');
    }

    public function test_almacen_rechaza_carpetas_con_salto_de_directorio(): void
    {
        Storage::fake('public');

        $this->expectException(InvalidArgumentException::class);

        (new AlmacenArchivos)->guardarContenido('x', '../config', 'php');
    }

    public function test_procesador_rechaza_mime_no_permitido(): void
    {
        $this->expectException(ReglaNegocioException::class);
        $this->expectExceptionMessage('La imagen debe ser JPG, PNG o WebP.');

        (new ProcesadorImagenes)->publicacion(UploadedFile::fake()->createWithContent('foto.png', '%PDF-1.4 no es imagen'));
    }

    public function test_procesador_rechaza_imagen_pequena_con_el_campo(): void
    {
        try {
            (new ProcesadorImagenes)->fotoDocente(UploadedFile::fake()->createWithContent('foto.png', self::png(100, 100)));
            $this->fail('Se esperaba ReglaNegocioException.');
        } catch (ReglaNegocioException $error) {
            $this->assertSame('foto', $error->campo());
            $this->assertSame('La imagen debe medir al menos 300×300 px.', $error->getMessage());
        }
    }

    public function test_procesador_rechaza_imagen_de_mas_de_5_mb(): void
    {
        $this->expectExceptionMessage('La imagen no puede superar 5 MB.');

        (new ProcesadorImagenes)->publicacion(UploadedFile::fake()->createWithContent('foto.png', self::png(800, 600).str_repeat("\0", 5 * 1024 * 1024)));
    }

    public function test_procesador_recorta_publicacion_a_600x400_webp_con_el_gestor_inyectado(): void
    {
        $codificada = Mockery::mock(EncodedImageInterface::class);
        $codificada->shouldReceive('toString')->andReturn('RIFF-webp');

        $imagen = Mockery::mock(ImageInterface::class);
        $imagen->shouldReceive('cover')->once()->with(600, 400)->andReturnSelf();
        $imagen->shouldReceive('toWebp')->once()->withAnyArgs()->andReturn($codificada);
        $imagen->shouldReceive('width')->andReturn(600);
        $imagen->shouldReceive('height')->andReturn(400);

        $gestor = Mockery::mock(ImageManagerInterface::class);
        $gestor->shouldReceive('read')->once()->andReturn($imagen);

        $resultado = (new ProcesadorImagenes($gestor))->publicacion(UploadedFile::fake()->createWithContent('foto.png', self::png(1200, 800)));

        $this->assertSame(['RIFF-webp', 600, 400, 'webp'], [$resultado->contenido, $resultado->ancho, $resultado->alto, $resultado->extension]);
    }

    public function test_procesador_reduce_foto_docente_a_900_px(): void
    {
        $codificada = Mockery::mock(EncodedImageInterface::class);
        $codificada->shouldReceive('toString')->andReturn('webp');

        $imagen = Mockery::mock(ImageInterface::class);
        $imagen->shouldReceive('scaleDown')->once()->with(900, 900)->andReturnSelf();
        $imagen->shouldReceive('toWebp')->andReturn($codificada);
        $imagen->shouldReceive('width')->andReturn(600);
        $imagen->shouldReceive('height')->andReturn(900);

        $gestor = Mockery::mock(ImageManagerInterface::class);
        $gestor->shouldReceive('read')->andReturn($imagen);

        $resultado = (new ProcesadorImagenes($gestor))->fotoDocente(UploadedFile::fake()->createWithContent('foto.png', self::png(1000, 1500)));

        $this->assertSame([600, 900], [$resultado->ancho, $resultado->alto]);
    }

    #[RequiresPhpExtension('gd')]
    public function test_procesador_con_gd_real_genera_webp_600x400(): void
    {
        $resultado = (new ProcesadorImagenes)->publicacion(UploadedFile::fake()->image('foto.jpg', 1200, 900));

        $this->assertSame([600, 400], [$resultado->ancho, $resultado->alto]);
        $this->assertStringStartsWith('RIFF', $resultado->contenido);
        $this->assertSame([600, 400], array_slice((array) getimagesizefromstring($resultado->contenido), 0, 2));
    }

    #[RequiresPhpExtension('gd')]
    public function test_procesador_con_gd_real_reduce_foto_a_900(): void
    {
        $resultado = (new ProcesadorImagenes)->fotoDocente(UploadedFile::fake()->image('foto.png', 1800, 1200));

        $this->assertSame([900, 600], [$resultado->ancho, $resultado->alto]);
    }

    public function test_verificador_considera_operativo_2xx_3xx_y_reintenta_con_get_ante_405(): void
    {
        Http::fake([
            'https://ok.test/*' => Http::response('', 200),
            'https://caido.test/*' => Http::response('', 500),
            'https://sin-head.test/*' => fn (PeticionHttp $peticion) => $peticion->method() === 'HEAD'
                ? Http::response('', 405)
                : Http::response('', 204),
            'https://sin-red.test/*' => fn () => throw new ConnectionException('timeout'),
        ]);

        $verificador = new VerificadorEnlaces;

        $this->assertSame(['ok' => true, 'estado_http' => 200], $verificador->verificar('https://ok.test/portal')->aArreglo());
        $this->assertSame(['ok' => false, 'estado_http' => 500], $verificador->verificar('https://caido.test/x')->aArreglo());
        $this->assertSame(['ok' => true, 'estado_http' => 204], $verificador->verificar('https://sin-head.test/x')->aArreglo());
        $this->assertSame(['ok' => false, 'estado_http' => null], $verificador->verificar('https://sin-red.test/x')->aArreglo());

        $varios = $verificador->verificarVarios(['url_portal' => 'https://ok.test/a', 'url_estadisticas' => null]);
        $this->assertTrue($varios['url_portal']->ok);
        $this->assertFalse($varios['url_estadisticas']->ok);
    }

    public function test_notificador_avisa_a_revisores_menos_al_autor(): void
    {
        Mail::fake();
        $destinatarios = Mockery::mock(DestinatariosRepositorio::class);
        $destinatarios->shouldReceive('correosActivosPorRol')->with('Revisor')->andReturn(['director@unitru.edu.pe', 'autor@unitru.edu.pe']);
        $destinatarios->shouldReceive('correoUsuarioActivo')->with(5)->andReturn('autor@unitru.edu.pe');

        (new NotificadorRevision($destinatarios))->enviadoARevision(EntidadRevisable::Publicacion, 12, 'Ceremonia', idExcluido: 5);

        Mail::assertSent(ContenidoEnRevisionMail::class, fn (ContenidoEnRevisionMail $correo): bool => $correo->hasTo('director@unitru.edu.pe'));
        Mail::assertSent(ContenidoEnRevisionMail::class, 1);
    }

    public function test_notificador_avisa_la_decision_al_editor(): void
    {
        Mail::fake();
        $destinatarios = Mockery::mock(DestinatariosRepositorio::class);
        $destinatarios->shouldReceive('correoUsuarioActivo')->with(4)->andReturn('editor@unitru.edu.pe');

        (new NotificadorRevision($destinatarios))->decisionTomada(EntidadRevisable::Docente, 9, 'Ana Pérez', 4, TipoDecision::Observar, 'Falta el grado.');

        Mail::assertSent(DecisionRevisionMail::class, fn (DecisionRevisionMail $correo): bool => $correo->hasTo('editor@unitru.edu.pe')
            && str_contains($correo->render(), 'Falta el grado.'));
    }

    public function test_notificador_nunca_rompe_la_operacion(): void
    {
        $destinatarios = Mockery::mock(DestinatariosRepositorio::class);
        $destinatarios->shouldReceive('correosActivosPorRol')->andThrow(new RuntimeException('BD caída'));

        (new NotificadorRevision($destinatarios))->enviadoARevision(EntidadRevisable::Plan, 1, 'Plan 2027 v1');

        $this->addToAssertionCount(1);
    }
}
