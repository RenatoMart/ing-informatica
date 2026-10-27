<?php

namespace App\Dominio\Docentes;

use App\Dominio\Compartido\Arreglable;
use App\Dominio\Compartido\Excepciones\ReglaNegocioException;

/**
 * Entidad Docente (HU3). Reglas replicadas en `sp_docente_*`: nombres y apellidos obligatorios,
 * RENACYT obligatorio solo si es investigador (nulo en caso contrario), de 1 a 5 especialidades
 * distintas de ≤150 caracteres, condición `nombrado`/`contratado`, encuadre 0–100.
 */
final readonly class Docente implements Arreglable
{
    public const MIN_ESPECIALIDADES = 1;

    public const MAX_ESPECIALIDADES = 5;

    public const ESPECIALIDAD_MAX = 150;

    /**
     * @param  list<string>  $especialidades
     */
    public function __construct(
        public ?int $id,
        public string $nombres,
        public string $apellidos,
        public ?string $gradoAcademico,
        public ?int $idDepartamento,
        public ?string $cursoPrincipal,
        public ?CondicionLaboral $condicion,
        public bool $esInvestigador,
        public ?string $categoriaRenacyt,
        public array $especialidades,
        public EstadoDocente $estado = EstadoDocente::Borrador,
        public Encuadre $encuadre = new Encuadre,
        public ?string $rutaFotografia = null,
        public ?string $operacionPendiente = null,
        public ?string $observacionesRevision = null,
        /** @var array<string, mixed>|null */
        public ?array $cambiosPendientes = null,
        public ?string $departamento = null,
    ) {}

    /**
     * Normaliza y valida los datos editables.
     *
     * @param  list<string>  $especialidades
     * @return list<string> Especialidades limpias (sin vacías ni espacios sobrantes).
     *
     * @throws ReglaNegocioException
     */
    public static function validarCampos(
        string $nombres,
        string $apellidos,
        ?string $condicion,
        bool $esInvestigador,
        ?string $categoriaRenacyt,
        array $especialidades,
    ): array {
        if (trim($nombres) === '' || mb_strlen($nombres) > 100) {
            throw new ReglaNegocioException('Los nombres son obligatorios (máximo 100 caracteres).', 'nombres');
        }

        if (trim($apellidos) === '' || mb_strlen($apellidos) > 100) {
            throw new ReglaNegocioException('Los apellidos son obligatorios (máximo 100 caracteres).', 'apellidos');
        }

        if ($condicion !== null && $condicion !== '' && CondicionLaboral::tryFrom($condicion) === null) {
            throw new ReglaNegocioException('La condición laboral debe ser nombrado o contratado.', 'condicion_laboral');
        }

        $categoria = trim($categoriaRenacyt ?? '');

        if ($esInvestigador && $categoria === '') {
            throw new ReglaNegocioException('La categoría RENACYT es obligatoria para un docente investigador.', 'categoria_renacyt');
        }

        if (! $esInvestigador && $categoria !== '') {
            throw new ReglaNegocioException('La categoría RENACYT solo aplica a un docente investigador.', 'categoria_renacyt');
        }

        if (mb_strlen($categoria) > 50) {
            throw new ReglaNegocioException('La categoría RENACYT no puede superar 50 caracteres.', 'categoria_renacyt');
        }

        return self::normalizarEspecialidades($especialidades);
    }

    /**
     * @param  list<string>  $especialidades
     * @return list<string>
     *
     * @throws ReglaNegocioException
     */
    public static function normalizarEspecialidades(array $especialidades): array
    {
        $limpias = array_values(array_filter(
            array_map(static fn (string $e): string => trim($e), $especialidades),
            static fn (string $e): bool => $e !== '',
        ));

        if (count($limpias) < self::MIN_ESPECIALIDADES || count($limpias) > self::MAX_ESPECIALIDADES) {
            throw new ReglaNegocioException('Indique entre 1 y 5 especialidades.', 'especialidades');
        }

        if (count(array_unique($limpias)) !== count($limpias)) {
            throw new ReglaNegocioException('Las especialidades no pueden repetirse.', 'especialidades');
        }

        foreach ($limpias as $especialidad) {
            if (mb_strlen($especialidad) > self::ESPECIALIDAD_MAX) {
                throw new ReglaNegocioException('Cada especialidad admite como máximo 150 caracteres.', 'especialidades');
            }
        }

        return $limpias;
    }

    /**
     * Requisitos para enviar a revisión: grado académico y curso principal.
     *
     * @throws ReglaNegocioException
     */
    public function validarParaEnviar(): void
    {
        if (trim($this->gradoAcademico ?? '') === '') {
            throw new ReglaNegocioException('El grado académico es obligatorio para enviar a revisión.', 'grado_academico');
        }

        if (trim($this->cursoPrincipal ?? '') === '') {
            throw new ReglaNegocioException('El curso principal es obligatorio para enviar a revisión.', 'curso_principal');
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function aArreglo(): array
    {
        return [
            'id_docente' => $this->id,
            'nombres' => $this->nombres,
            'apellidos' => $this->apellidos,
            'grado_academico' => $this->gradoAcademico,
            'id_departamento' => $this->idDepartamento,
            'departamento' => $this->departamento,
            'curso_principal' => $this->cursoPrincipal,
            'condicion_laboral' => $this->condicion?->value,
            'es_investigador' => $this->esInvestigador,
            'categoria_renacyt' => $this->categoriaRenacyt,
            'especialidades' => $this->especialidades,
            'estado' => $this->estado->value,
            'operacion_pendiente' => $this->operacionPendiente,
            'ruta_fotografia' => $this->rutaFotografia,
            'observaciones_revision' => $this->observacionesRevision,
            'cambios_pendientes' => $this->cambiosPendientes,
        ] + $this->encuadre->aArreglo();
    }
}
