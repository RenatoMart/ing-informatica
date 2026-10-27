<?php

namespace Tests\Unit\Revision;

use App\Dominio\Compartido\Excepciones\AccesoDenegadoException;
use App\Dominio\Compartido\Excepciones\ReglaNegocioException;
use App\Dominio\Revision\DecisionRevision;
use App\Dominio\Revision\TipoDecision;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class DecisionRevisionTest extends TestCase
{
    public function test_aprobar_sin_observaciones_es_valido(): void
    {
        $decision = new DecisionRevision(TipoDecision::Aprobar, idRevisor: 2, idEditor: 1);

        $this->assertSame(TipoDecision::Aprobar, $decision->tipo);
        $this->assertNull($decision->observaciones);
    }

    public function test_el_revisor_no_puede_ser_el_editor(): void
    {
        $this->expectException(AccesoDenegadoException::class);
        $this->expectExceptionMessage('No puede revisar contenido que usted editó.');

        new DecisionRevision(TipoDecision::Aprobar, idRevisor: 3, idEditor: 3);
    }

    public function test_el_revisor_no_puede_ser_el_editor_del_cambio_pendiente(): void
    {
        $this->expectException(AccesoDenegadoException::class);

        new DecisionRevision(TipoDecision::Aprobar, idRevisor: 3, idEditor: 1, idEditorCambio: 3);
    }

    /**
     * @return array<string, array{TipoDecision, ?string}>
     */
    public static function observacionesInvalidas(): array
    {
        return [
            'observar sin observaciones' => [TipoDecision::Observar, null],
            'descartar con texto vacío' => [TipoDecision::Descartar, '   '],
            'observar con menos de 5 caracteres' => [TipoDecision::Observar, 'mal'],
            'observar con más de 500 caracteres' => [TipoDecision::Observar, str_repeat('a', 501)],
            'aprobar con más de 500 caracteres' => [TipoDecision::Aprobar, str_repeat('a', 501)],
        ];
    }

    #[DataProvider('observacionesInvalidas')]
    public function test_observaciones_invalidas_dan_422_en_el_campo_observaciones(TipoDecision $tipo, ?string $observaciones): void
    {
        try {
            new DecisionRevision($tipo, idRevisor: 2, idEditor: 1, observaciones: $observaciones);
            $this->fail('Se esperaba ReglaNegocioException.');
        } catch (ReglaNegocioException $error) {
            $this->assertSame('observaciones', $error->campo());
            $this->assertSame(422, $error->estadoHttp());
        }
    }

    public function test_observar_con_observaciones_validas_las_recorta(): void
    {
        $decision = new DecisionRevision(TipoDecision::Observar, 2, 1, '  Falta la imagen de portada.  ');

        $this->assertSame('Falta la imagen de portada.', $decision->observaciones);
    }

    public function test_observaciones_con_tildes_cuentan_caracteres_y_no_bytes(): void
    {
        $decision = new DecisionRevision(TipoDecision::Descartar, 2, 1, str_repeat('ñ', 500));

        $this->assertSame(500, mb_strlen((string) $decision->observaciones));
    }
}
