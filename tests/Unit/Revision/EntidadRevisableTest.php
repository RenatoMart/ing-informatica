<?php

namespace Tests\Unit\Revision;

use App\Dominio\Revision\AccionRevision;
use App\Dominio\Revision\EntidadRevisable;
use App\Dominio\Revision\TipoDecision;
use PHPUnit\Framework\TestCase;

class EntidadRevisableTest extends TestCase
{
    public function test_cada_entidad_conoce_su_tabla_pk_y_funcion_de_decision(): void
    {
        $esperado = [
            'publicacion' => ['publicacion', 'id_publicacion', 'sp_publicacion_decidir'],
            'docente' => ['docente', 'id_docente', 'sp_docente_decidir'],
            'plan' => ['plan_estudios', 'id_plan', 'sp_plan_decidir'],
            'documento' => ['documento_oficial', 'id_documento', 'sp_documento_decidir'],
            'campana' => ['campana_admision', 'id_campana', 'sp_campana_decidir'],
        ];

        foreach (EntidadRevisable::cases() as $entidad) {
            $this->assertSame(
                $esperado[$entidad->value],
                [$entidad->tabla(), $entidad->clavePrimaria(), $entidad->funcionDecidir()],
            );
            $this->assertSame($entidad, $entidad->politica()->entidad());
        }
    }

    public function test_solo_publicacion_y_docente_admiten_operacion_pendiente(): void
    {
        $this->assertSame(
            [EntidadRevisable::Publicacion, EntidadRevisable::Docente],
            array_values(array_filter(EntidadRevisable::cases(), static fn (EntidadRevisable $e): bool => $e->admiteOperacionPendiente())),
        );

        foreach (EntidadRevisable::cases() as $entidad) {
            if ($entidad->admiteOperacionPendiente()) {
                continue;
            }

            foreach ($entidad->politica()->transiciones() as $transicion) {
                $this->assertNull($transicion->operacion);
                $this->assertNull($transicion->operacionResultante);
            }
        }
    }

    public function test_decisiones_admitidas_por_entidad(): void
    {
        $this->assertTrue(EntidadRevisable::Publicacion->politica()->admite(TipoDecision::Descartar));
        $this->assertTrue(EntidadRevisable::Plan->politica()->admite(TipoDecision::Descartar));
        $this->assertTrue(EntidadRevisable::Documento->politica()->admite(TipoDecision::Descartar));
        $this->assertFalse(EntidadRevisable::Docente->politica()->admite(TipoDecision::Descartar));
        $this->assertFalse(EntidadRevisable::Campana->politica()->admite(TipoDecision::Descartar));

        foreach (EntidadRevisable::cases() as $entidad) {
            $this->assertTrue($entidad->politica()->admite(TipoDecision::Aprobar));
            $this->assertTrue($entidad->politica()->admite(TipoDecision::Observar));
        }
    }

    public function test_estados_publicos(): void
    {
        $this->assertSame(['publicada'], EntidadRevisable::Publicacion->politica()->estadosPublicos());
        $this->assertSame(['publicado'], EntidadRevisable::Docente->politica()->estadosPublicos());
        $this->assertSame(['vigente', 'historico'], EntidadRevisable::Plan->politica()->estadosPublicos());
        $this->assertSame(['vigente', 'historico'], EntidadRevisable::Documento->politica()->estadosPublicos());
        $this->assertSame(['vigente'], EntidadRevisable::Campana->politica()->estadosPublicos());
    }

    public function test_los_estados_coinciden_con_los_enum_de_postgresql(): void
    {
        $this->assertSame(['borrador', 'en_revision', 'publicada', 'descartada', 'despublicada'], EntidadRevisable::Publicacion->politica()->estados());
        $this->assertSame(['borrador', 'en_revision', 'publicado', 'inactivo'], EntidadRevisable::Docente->politica()->estados());
        $this->assertSame(['borrador', 'en_revision', 'vigente', 'historico', 'descartado'], EntidadRevisable::Plan->politica()->estados());
        $this->assertSame(['en_revision', 'vigente', 'historico', 'vencido', 'no_publicado'], EntidadRevisable::Documento->politica()->estados());
        $this->assertSame(['borrador', 'en_revision', 'vigente', 'cerrada', 'archivada'], EntidadRevisable::Campana->politica()->estados());
    }

    public function test_tipo_decision_se_corresponde_con_su_accion(): void
    {
        foreach (TipoDecision::cases() as $decision) {
            $this->assertTrue($decision->accion()->esDecision());
            $this->assertSame($decision->value, $decision->accion()->value);
        }

        $this->assertFalse(AccionRevision::Guardar->esDecision());
        $this->assertFalse(TipoDecision::Aprobar->exigeObservaciones());
        $this->assertTrue(TipoDecision::Observar->exigeObservaciones());
    }
}
