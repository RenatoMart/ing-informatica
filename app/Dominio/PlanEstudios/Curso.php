<?php

namespace App\Dominio\PlanEstudios;

use App\Dominio\Compartido\Arreglable;
use App\Dominio\Compartido\Excepciones\ReglaNegocioException;

/**
 * Curso de un plan: código (≤20, sin espacios), nombre, créditos 1..10, ciclo 1..10,
 * tipo, área y horas T/P entre 0 y 10 (sección 1.4).
 */
final class Curso implements Arreglable
{
    public const CREDITOS_MIN = 1;

    public const CREDITOS_MAX = 10;

    public const CICLO_MIN = 1;

    public const CICLO_MAX = 10;

    public const HORAS_MAX = 10;

    public readonly string $codigo;

    public readonly string $nombre;

    public readonly ?string $descripcion;

    /**
     * @throws ReglaNegocioException
     */
    public function __construct(
        string $codigo,
        string $nombre,
        public readonly int $creditos,
        public readonly TipoCurso $tipo,
        public readonly int $ciclo,
        public readonly AreaFormacion $area,
        public readonly int $horasTeoria,
        public readonly int $horasPractica,
        ?string $descripcion = null,
        public readonly ?int $idCurso = null,
    ) {
        $this->codigo = trim($codigo);
        $this->nombre = trim($nombre);
        $this->descripcion = $descripcion === null || trim($descripcion) === '' ? null : trim($descripcion);

        if ($this->codigo === '' || mb_strlen($this->codigo) > 20 || preg_match('/\s/', $this->codigo) === 1) {
            throw new ReglaNegocioException('El código es obligatorio, sin espacios y de máximo 20 caracteres.', 'codigo');
        }

        if ($this->nombre === '' || mb_strlen($this->nombre) > 150) {
            throw new ReglaNegocioException('El nombre es obligatorio (máximo 150 caracteres).', 'nombre');
        }

        self::exigirRango($creditos, self::CREDITOS_MIN, self::CREDITOS_MAX, 'creditos', 'Los créditos deben estar entre 1 y 10.');
        self::exigirRango($ciclo, self::CICLO_MIN, self::CICLO_MAX, 'ciclo', 'El ciclo debe estar entre 1 y 10.');
        self::exigirRango($horasTeoria, 0, self::HORAS_MAX, 'horas_teoria', 'Las horas de teoría deben estar entre 0 y 10.');
        self::exigirRango($horasPractica, 0, self::HORAS_MAX, 'horas_practica', 'Las horas de práctica deben estar entre 0 y 10.');

        if ($this->descripcion !== null && mb_strlen($this->descripcion) > 500) {
            throw new ReglaNegocioException('La descripción no puede superar 500 caracteres.', 'descripcion');
        }
    }

    /**
     * Construye el curso desde los datos de la petición (claves del API).
     *
     * @param  array<string, mixed>  $datos
     *
     * @throws ReglaNegocioException
     */
    public static function desdeArreglo(array $datos, ?int $idCurso = null): self
    {
        $tipo = TipoCurso::tryFrom((string) ($datos['tipo'] ?? ''))
            ?? throw new ReglaNegocioException('El tipo debe ser obligatorio o electivo.', 'tipo');
        $area = AreaFormacion::tryFrom((string) ($datos['area_formacion'] ?? ''))
            ?? throw new ReglaNegocioException('El área de formación debe ser general, especifico o especialidad.', 'area_formacion');

        return new self(
            (string) ($datos['codigo'] ?? ''),
            (string) ($datos['nombre'] ?? ''),
            (int) ($datos['creditos'] ?? 0),
            $tipo,
            (int) ($datos['ciclo'] ?? 0),
            $area,
            (int) ($datos['horas_teoria'] ?? 0),
            (int) ($datos['horas_practica'] ?? 0),
            isset($datos['descripcion']) ? (string) $datos['descripcion'] : null,
            $idCurso,
        );
    }

    /** @return array<string, mixed> */
    public function aArreglo(): array
    {
        return [
            'id_curso' => $this->idCurso,
            'codigo' => $this->codigo,
            'nombre' => $this->nombre,
            'creditos' => $this->creditos,
            'tipo' => $this->tipo->value,
            'ciclo' => $this->ciclo,
            'area_formacion' => $this->area->value,
            'horas_teoria' => $this->horasTeoria,
            'horas_practica' => $this->horasPractica,
            'descripcion' => $this->descripcion,
        ];
    }

    private static function exigirRango(int $valor, int $minimo, int $maximo, string $campo, string $mensaje): void
    {
        if ($valor < $minimo || $valor > $maximo) {
            throw new ReglaNegocioException($mensaje, $campo);
        }
    }
}
