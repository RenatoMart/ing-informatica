<?php

namespace Tests\Feature\DocumentosAdmision;

use App\Dominio\Compartido\Excepciones\ReglaNegocioException;
use App\Dominio\Compartido\Excepciones\TransicionInvalidaException;
use App\Dominio\DocumentosAdmision\ArchivoPdf;
use App\Dominio\DocumentosAdmision\CampanaAdmision;
use App\Dominio\DocumentosAdmision\DocumentoOficial;
use App\Dominio\DocumentosAdmision\EstadoCampana;
use App\Dominio\DocumentosAdmision\EstadoDocumento;
use App\Dominio\DocumentosAdmision\HitoCronograma;
use App\Dominio\DocumentosAdmision\ModalidadAdmision;
use App\Dominio\DocumentosAdmision\TipoDocumento;
use DateTimeImmutable;
use PHPUnit\Framework\TestCase;

/**
 * Reglas puras del dominio de documentos y admisión (sin BD).
 */
class DominioDocumentosAdmisionTest extends TestCase
{
    private function fecha(string $f): DateTimeImmutable
    {
        return new DateTimeImmutable($f);
    }

    private function documento(TipoDocumento $tipo = TipoDocumento::Resolucion, string $vigencia = '2027-01-01'): DocumentoOficial
    {
        return DocumentoOficial::crear($tipo, 'RES-1', 'Título', $this->fecha('2026-01-01'), 1, $this->fecha($vigencia));
    }

    public function test_vigencia_no_puede_ser_anterior_a_la_emision(): void
    {
        $this->expectException(ReglaNegocioException::class);
        $this->documento(vigencia: '2025-12-31');
    }

    public function test_numero_y_titulo_con_limites(): void
    {
        $this->expectException(ReglaNegocioException::class);
        DocumentoOficial::crear(TipoDocumento::Guia, str_repeat('9', 51), 'T', $this->fecha('2026-01-01'), 1, $this->fecha('2026-02-01'));
    }

    public function test_version_anterior_solo_vigente_o_vencida_y_del_mismo_tipo(): void
    {
        $doc = $this->documento();
        $doc->validarVersionAnterior(TipoDocumento::Resolucion, EstadoDocumento::Vigente);
        $doc->validarVersionAnterior(TipoDocumento::Resolucion, EstadoDocumento::Vencido);

        foreach ([
            [TipoDocumento::Guia, EstadoDocumento::Vigente, false],
            [TipoDocumento::Resolucion, EstadoDocumento::EnRevision, false],
            [TipoDocumento::Resolucion, EstadoDocumento::Historico, false],
            [TipoDocumento::Resolucion, EstadoDocumento::Vigente, true],
        ] as [$tipo, $estado, $reemplazada]) {
            try {
                $doc->validarVersionAnterior($tipo, $estado, $reemplazada);
                $this->fail('Debió rechazar la versión anterior.');
            } catch (TransicionInvalidaException) {
                $this->addToAssertionCount(1);
            }
        }
    }

    public function test_vencimiento_compara_por_dia(): void
    {
        $doc = $this->documento(vigencia: '2026-06-10');

        $this->assertFalse($doc->estaVencido($this->fecha('2026-06-10 23:59')));
        $this->assertTrue($doc->estaVencido($this->fecha('2026-06-11')));
    }

    public function test_archivo_pdf(): void
    {
        $this->assertSame(1024, ArchivoPdf::desde('application/pdf', 1024)->bytes);

        $this->expectException(ReglaNegocioException::class);
        ArchivoPdf::desde('image/png', 1024);
    }

    public function test_archivo_pdf_mayor_de_10_mb(): void
    {
        $this->expectException(ReglaNegocioException::class);
        ArchivoPdf::desde('application/pdf', ArchivoPdf::BYTES_MAXIMO + 1);
    }

    public function test_campana_fechas_en_orden_y_urls_https(): void
    {
        $campana = CampanaAdmision::crear(2027, ' I ', $this->fecha('2027-01-01'), $this->fecha('2027-03-01'), 'https://a.pe', null);
        $this->assertSame('I', $campana->proceso);
        $this->assertTrue($campana->haTerminado($this->fecha('2027-03-02')));
        $this->assertFalse($campana->haTerminado($this->fecha('2027-03-01')));

        $this->expectException(ReglaNegocioException::class);
        CampanaAdmision::crear(2027, 'I', $this->fecha('2027-03-01'), $this->fecha('2027-01-01'), null, null);
    }

    public function test_campana_rechaza_url_http(): void
    {
        $this->expectException(ReglaNegocioException::class);
        CampanaAdmision::crear(2027, 'I', null, null, 'http://a.pe', null);
    }

    public function test_modalidad_exige_vacantes_positivas(): void
    {
        $this->assertSame(10, ModalidadAdmision::crear('Ordinario', null, 10, null)->vacantes);

        $this->expectException(ReglaNegocioException::class);
        ModalidadAdmision::crear('Ordinario', null, 0, null);
    }

    public function test_hito_dentro_del_periodo(): void
    {
        $inicio = $this->fecha('2027-01-01');
        $fin = $this->fecha('2027-03-01');
        $this->assertSame('Examen', HitoCronograma::crear('Examen', $this->fecha('2027-03-01'), $inicio, $fin)->hito);

        $this->expectException(ReglaNegocioException::class);
        HitoCronograma::crear('Examen', $this->fecha('2027-03-02'), $inicio, $fin);
    }

    public function test_solo_el_borrador_es_editable_y_la_nueva_vigente_archiva_vigente_y_cerrada(): void
    {
        $this->assertTrue(EstadoCampana::Borrador->esEditable());
        $this->assertFalse(EstadoCampana::EnRevision->esEditable());
        $this->assertSame(EstadoCampana::Archivada, EstadoCampana::Vigente->alAprobarOtraVigente());
        $this->assertSame(EstadoCampana::Archivada, EstadoCampana::Cerrada->alAprobarOtraVigente());
        $this->assertSame(EstadoCampana::Borrador, EstadoCampana::Borrador->alAprobarOtraVigente());
        $this->assertTrue(EstadoDocumento::NoPublicado->esEditable());
    }
}
