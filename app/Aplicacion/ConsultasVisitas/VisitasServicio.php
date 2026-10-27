<?php

namespace App\Aplicacion\ConsultasVisitas;

use App\Dominio\Compartido\Excepciones\ReglaNegocioException;
use App\Dominio\ConsultasVisitas\SeccionVisita;
use App\Persistencia\ConsultasVisitas\VisitaRepositorio;
use DateTimeImmutable;

/**
 * Registro anónimo de visitas y estadísticas por sección y día.
 */
class VisitasServicio
{
    public function __construct(private readonly VisitaRepositorio $repositorio) {}

    public function registrar(SeccionVisita $seccion): void
    {
        $this->repositorio->registrar($seccion->value);
    }

    /**
     * @return array{por_seccion: list<array{seccion: string, total: int}>, por_dia: list<array{dia: string, seccion: string, total: int}>}
     */
    public function estadisticas(?string $desde, ?string $hasta): array
    {
        $fin = $hasta === null ? new DateTimeImmutable('today') : new DateTimeImmutable($hasta);
        $inicio = $desde === null ? $fin->modify('-29 days') : new DateTimeImmutable($desde);

        if ($inicio > $fin) {
            throw new ReglaNegocioException('La fecha inicial no puede ser posterior a la final.', 'desde');
        }
        if ($inicio->diff($fin)->days > 365) {
            throw new ReglaNegocioException('El rango máximo es de 366 días.', 'hasta');
        }

        $filas = $this->repositorio->estadisticas($inicio->format('Y-m-d'), $fin->format('Y-m-d'));

        $porSeccion = [];
        foreach ($filas as $fila) {
            $porSeccion[$fila['seccion']] = ($porSeccion[$fila['seccion']] ?? 0) + $fila['total'];
        }
        arsort($porSeccion);

        $resumen = [];
        foreach ($porSeccion as $seccion => $total) {
            $resumen[] = ['seccion' => (string) $seccion, 'total' => $total];
        }

        return ['por_seccion' => $resumen, 'por_dia' => $filas === [] ? [] : array_map(static fn (array $f): array => ['dia' => $f['dia'], 'seccion' => $f['seccion'], 'total' => $f['total']], $filas)];
    }
}
