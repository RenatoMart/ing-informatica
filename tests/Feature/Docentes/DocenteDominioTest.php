<?php

namespace Tests\Feature\Docentes;

use App\Dominio\Compartido\Excepciones\ReglaNegocioException;
use App\Dominio\Docentes\Docente;
use App\Dominio\Docentes\Encuadre;
use App\Dominio\Docentes\FotoDocente;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * Reglas puras de Docentes (sin BD).
 */
class DocenteDominioTest extends TestCase
{
    public function test_encuadre(): void
    {
        $this->assertSame('50% 25%', (new Encuadre)->aObjectPosition());
        $this->assertSame(['encuadre_x' => 0, 'encuadre_y' => 100], (new Encuadre(0, 100))->aArreglo());

        $this->expectException(ReglaNegocioException::class);
        new Encuadre(101, 0);
    }

    public function test_renacyt_solo_para_investigador(): void
    {
        $this->assertSame(['IA'], Docente::validarCampos('Ana', 'Paz', 'nombrado', true, 'Nivel I', [' IA ']));
        $this->assertSame(['IA'], Docente::validarCampos('Ana', 'Paz', null, false, null, ['IA']));

        foreach ([[true, null], [true, ' '], [false, 'Nivel I']] as [$investigador, $categoria]) {
            try {
                Docente::validarCampos('Ana', 'Paz', null, $investigador, $categoria, ['IA']);
                $this->fail('Debió fallar.');
            } catch (ReglaNegocioException $e) {
                $this->assertSame('categoria_renacyt', $e->campo());
            }
        }
    }

    /**
     * @param  list<string>  $especialidades
     */
    #[DataProvider('especialidadesInvalidas')]
    public function test_especialidades_invalidas(array $especialidades): void
    {
        $this->expectException(ReglaNegocioException::class);
        Docente::normalizarEspecialidades($especialidades);
    }

    /**
     * @return array<string, array{list<string>}>
     */
    public static function especialidadesInvalidas(): array
    {
        return [
            'ninguna' => [[]],
            'solo vacias' => [['', '  ']],
            'seis' => [['a', 'b', 'c', 'd', 'e', 'f']],
            'repetidas' => [['IA', 'IA']],
            'larga' => [[str_repeat('x', 151)]],
        ];
    }

    public function test_condicion_invalida(): void
    {
        $this->expectException(ReglaNegocioException::class);
        Docente::validarCampos('Ana', 'Paz', 'interino', false, null, ['IA']);
    }

    public function test_foto_docente(): void
    {
        $foto = new FotoDocente('image/png', 1000, 1800, 1200);
        $this->assertSame([900, 600], $foto->dimensionesFinales());
        $this->assertSame([400, 300], (new FotoDocente('image/webp', 1000, 400, 300))->dimensionesFinales());

        foreach ([['application/pdf', 1000, 400, 400], ['image/png', 6 * 1024 * 1024, 400, 400], ['image/png', 1000, 299, 400]] as [$mime, $bytes, $ancho, $alto]) {
            try {
                new FotoDocente($mime, $bytes, $ancho, $alto);
                $this->fail('Debió fallar.');
            } catch (ReglaNegocioException $e) {
                $this->assertSame('foto', $e->campo());
            }
        }
    }
}
