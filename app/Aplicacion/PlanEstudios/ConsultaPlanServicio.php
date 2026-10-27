<?php

namespace App\Aplicacion\PlanEstudios;

use App\Aplicacion\Compartido\AlmacenArchivos;
use App\Dominio\Compartido\Excepciones\NoEncontradoException;
use App\Persistencia\PlanEstudios\PlanPublicoRepositorio;

/**
 * Consulta pública: versiones (vigente + histórico) y malla (cursos + aristas) lista para ReactFlow.
 */
class ConsultaPlanServicio
{
    private const NUMEROS_ROMANOS = [1 => 'I', 2 => 'II', 3 => 'III', 4 => 'IV', 5 => 'V', 6 => 'VI', 7 => 'VII', 8 => 'VIII', 9 => 'IX', 10 => 'X'];

    private const COLOR_ARISTA = ['general' => '#f97316', 'especifico' => '#f97316', 'especialidad' => '#38bdf8'];

    private const SEPARACION_COLUMNAS = 320;

    public function __construct(
        private readonly PlanPublicoRepositorio $repositorio,
        private readonly AlmacenArchivos $archivos,
    ) {}

    /**
     * @return list<array<string, mixed>>
     */
    public function versiones(): array
    {
        return array_map(static fn (array $p): array => [
            'id_plan' => $p['id_plan'],
            'anio' => $p['anio'],
            'version' => $p['version'],
            'estado' => $p['estado'],
            'es_predeterminada' => $p['es_predeterminada'],
        ], $this->repositorio->planes());
    }

    /**
     * Plan predeterminado (o el vigente más reciente).
     *
     * @return array<string, mixed>
     *
     * @throws NoEncontradoException
     */
    public function predeterminado(): array
    {
        $id = $this->repositorio->idPredeterminado()
            ?? throw new NoEncontradoException('No hay un plan de estudios publicado.');

        return $this->malla($id);
    }

    /**
     * Forma que consume `MallaFlow.tsx`: `cursos[]` (CourseData) y `aristas[]` (Edge), más `columnas`
     * (posición X por ciclo) y la lista cruda `prerrequisitos` por código.
     *
     * @return array<string, mixed>
     *
     * @throws NoEncontradoException
     */
    public function malla(int $idPlan): array
    {
        $plan = $this->repositorio->plan($idPlan);
        $filas = $this->repositorio->cursos($idPlan);

        $areaPorCodigo = [];
        $cursos = [];
        $columnas = [];
        foreach ($filas as $fila) {
            $codigo = (string) $fila['codigo'];
            $ciclo = (int) $fila['ciclo'];
            $etiqueta = 'Ciclo '.(self::NUMEROS_ROMANOS[$ciclo] ?? (string) $ciclo);
            $area = (string) $fila['area_formacion'];
            $areaPorCodigo[$codigo] = $area;
            $columnas[$etiqueta] = ($ciclo - 1) * self::SEPARACION_COLUMNAS;

            $cursos[] = [
                'id' => $codigo,
                'name' => (string) $fila['nombre'],
                'type' => $area,
                'credits' => (int) $fila['creditos'],
                'hoursT' => (int) $fila['horas_teoria'],
                'hoursP' => (int) $fila['horas_practica'],
                'cycle' => $etiqueta,
                'isElective' => $fila['tipo'] === 'electivo',
                'description' => (string) ($fila['descripcion'] ?? ''),
            ];
        }

        $prerrequisitos = $this->repositorio->prerrequisitos($idPlan);
        $aristas = [];
        foreach ($prerrequisitos as $i => $arista) {
            $color = self::COLOR_ARISTA[$areaPorCodigo[$arista['codigo_requerido']] ?? 'general'] ?? '#f97316';
            $aristas[] = [
                'id' => 'e-'.($i + 1),
                'source' => $arista['codigo_requerido'],
                'target' => $arista['codigo_curso'],
                'style' => ['stroke' => $color, 'strokeWidth' => 2],
            ];
        }

        return [
            'plan' => [
                'id_plan' => $plan['id_plan'],
                'anio' => $plan['anio'],
                'version' => $plan['version'],
                'estado' => $plan['estado'],
                'es_predeterminada' => $plan['es_predeterminada'],
                'pdf_plan_url' => $this->archivos->url($plan['archivo_pdf_plan']),
                'pdf_resolucion_url' => $this->archivos->url($plan['archivo_pdf_resolucion']),
            ],
            'cursos' => $cursos,
            'aristas' => $aristas,
            'columnas' => $columnas,
            'prerrequisitos' => $prerrequisitos,
        ];
    }
}
