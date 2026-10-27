<?php

namespace Tests\Unit\PlanEstudios;

use App\Dominio\Compartido\Excepciones\ReglaNegocioException;
use App\Dominio\PlanEstudios\AreaFormacion;
use App\Dominio\PlanEstudios\Curso;
use App\Dominio\PlanEstudios\GrafoPrerrequisitos;
use App\Dominio\PlanEstudios\Prerrequisitos;
use App\Dominio\PlanEstudios\TipoCurso;
use App\Dominio\PlanEstudios\ValidadorPlan;
use PHPUnit\Framework\TestCase;

class GrafoPrerrequisitosTest extends TestCase
{
    public function test_sin_ciclo(): void
    {
        $grafo = new GrafoPrerrequisitos(['B' => ['A'], 'C' => ['A', 'B']]);

        $this->assertNull($grafo->detectarCiclo());
    }

    public function test_ciclo_directo_e_indirecto(): void
    {
        $this->assertSame(['A', 'B', 'A'], (new GrafoPrerrequisitos(['A' => ['B'], 'B' => ['A']]))->detectarCiclo());
        $this->assertSame(['B', 'C', 'D', 'B'], (new GrafoPrerrequisitos(['A' => ['B'], 'B' => ['C'], 'C' => ['D'], 'D' => ['B']]))->detectarCiclo());
        $this->assertSame(['A', 'A'], (new GrafoPrerrequisitos(['A' => ['A']]))->detectarCiclo());
    }

    public function test_advertencia_de_ciclo_del_requerido(): void
    {
        $grafo = new GrafoPrerrequisitos(['B' => ['A']], ['A' => 2, 'B' => 2]);

        $this->assertCount(1, $grafo->advertencias());
    }

    public function test_curso_valida_sus_rangos(): void
    {
        $this->expectException(ReglaNegocioException::class);
        new Curso('A 1', 'Nombre', 3, TipoCurso::Obligatorio, 1, AreaFormacion::General, 2, 2);
    }

    public function test_prerrequisitos_no_admite_el_mismo_curso(): void
    {
        $this->expectException(ReglaNegocioException::class);
        new Prerrequisitos(1, [2, 1]);
    }

    public function test_validador_reporta_errores_y_advertencias(): void
    {
        $curso = new Curso('A1', 'Uno', 3, TipoCurso::Obligatorio, 2, AreaFormacion::General, 2, 2);
        $codigos = array_column((new ValidadorPlan)->validar([$curso], new GrafoPrerrequisitos, false, true), 'codigo');

        $this->assertContains('CICLOS_NO_CONTIGUOS', $codigos);
        $this->assertContains('CREDITOS_CICLO', $codigos);
        $this->assertContains('FALTA_PDF_PLAN', $codigos);
        $this->assertNotContains('FALTA_PDF_RESOLUCION', $codigos);
    }
}
