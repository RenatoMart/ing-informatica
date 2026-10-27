<?php

namespace App\Dominio\PlanEstudios;

/**
 * Valida la estructura del plan en memoria con las mismas reglas que `sp_plan_validar`
 * (errores y advertencias). El reporte oficial lo entrega la BD; esta clase permite probar la regla pura.
 */
final class ValidadorPlan
{
    public const CREDITOS_CICLO_MIN = 18;

    public const CREDITOS_CICLO_MAX = 26;

    /**
     * @param  list<Curso>  $cursos
     * @return list<array{nivel: string, codigo: string, mensaje: string}>
     */
    public function validar(array $cursos, GrafoPrerrequisitos $grafo, bool $tienePdfPlan, bool $tienePdfResolucion): array
    {
        $reporte = [];

        if ($cursos === []) {
            $reporte[] = self::fila('error', 'SIN_CURSOS', 'El plan no tiene cursos');
        } else {
            $creditos = [];
            foreach ($cursos as $curso) {
                $creditos[$curso->ciclo] = ($creditos[$curso->ciclo] ?? 0) + $curso->creditos;
            }

            $faltan = array_filter(range(1, max(array_keys($creditos))), static fn (int $ciclo): bool => ! isset($creditos[$ciclo]));
            if ($faltan !== []) {
                $reporte[] = self::fila('error', 'CICLOS_NO_CONTIGUOS', 'Faltan los ciclos: '.implode(', ', $faltan));
            }

            ksort($creditos);
            foreach ($creditos as $ciclo => $total) {
                if ($total === 0) {
                    $reporte[] = self::fila('error', 'CICLO_SIN_CREDITOS', "El ciclo {$ciclo} no suma créditos");
                } elseif ($total < self::CREDITOS_CICLO_MIN || $total > self::CREDITOS_CICLO_MAX) {
                    $reporte[] = self::fila('advertencia', 'CREDITOS_CICLO', "El ciclo {$ciclo} suma {$total} créditos (se esperan de 18 a 26)");
                }
            }
        }

        $ruta = $grafo->detectarCiclo();
        if ($ruta !== null) {
            $reporte[] = self::fila('error', 'PRERREQUISITO_CIRCULAR', 'Prerrequisito circular: '.implode(' → ', $ruta));
        }

        foreach ($grafo->advertencias() as $aviso) {
            $reporte[] = self::fila('advertencia', 'PRERREQUISITO_CICLO', $aviso);
        }

        if (! $tienePdfPlan) {
            $reporte[] = self::fila('error', 'FALTA_PDF_PLAN', 'Falta el PDF del plan');
        }

        if (! $tienePdfResolucion) {
            $reporte[] = self::fila('error', 'FALTA_PDF_RESOLUCION', 'Falta el PDF de la resolución');
        }

        return $reporte;
    }

    /** @return array{nivel: string, codigo: string, mensaje: string} */
    private static function fila(string $nivel, string $codigo, string $mensaje): array
    {
        return ['nivel' => $nivel, 'codigo' => $codigo, 'mensaje' => $mensaje];
    }
}
