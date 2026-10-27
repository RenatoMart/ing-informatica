<?php

namespace App\Dominio\DocumentosAdmision;

use App\Dominio\Compartido\Arreglable;
use App\Dominio\Compartido\Excepciones\ReglaNegocioException;
use App\Dominio\Compartido\Excepciones\TransicionInvalidaException;
use DateTimeImmutable;

/**
 * Reglas de un documento oficial (HU5, P7): tipo, número ≤ 50, título ≤ 200 [EXTRA],
 * vigencia ≥ emisión y versión anterior válida (vigente/vencido y del mismo tipo).
 */
final readonly class DocumentoOficial implements Arreglable
{
    public const NUMERO_MAXIMO = 50;

    public const TITULO_MAXIMO = 200;

    private function __construct(
        public TipoDocumento $tipo,
        public string $numero,
        public string $titulo,
        public DateTimeImmutable $fechaEmision,
        public int $idDepartamentoEmisor,
        public DateTimeImmutable $fechaVigencia,
    ) {}

    /**
     * @throws ReglaNegocioException
     */
    public static function crear(
        TipoDocumento $tipo,
        string $numero,
        string $titulo,
        DateTimeImmutable $fechaEmision,
        int $idDepartamentoEmisor,
        DateTimeImmutable $fechaVigencia,
    ): self {
        $numero = trim($numero);
        $titulo = trim($titulo);

        if ($numero === '' || mb_strlen($numero) > self::NUMERO_MAXIMO) {
            throw new ReglaNegocioException('El número es obligatorio (máximo 50 caracteres).', 'numero');
        }

        if ($titulo === '' || mb_strlen($titulo) > self::TITULO_MAXIMO) {
            throw new ReglaNegocioException('El título es obligatorio (máximo 200 caracteres).', 'titulo');
        }

        if ($fechaVigencia < $fechaEmision) {
            throw new ReglaNegocioException('La fecha de vigencia no puede ser anterior a la de emisión.', 'fecha_vigencia');
        }

        return new self($tipo, $numero, $titulo, $fechaEmision, $idDepartamentoEmisor, $fechaVigencia);
    }

    /**
     * Una versión anterior solo es válida si está vigente o vencida, es del mismo tipo
     * y todavía no tiene un reemplazo.
     *
     * @throws TransicionInvalidaException
     */
    public function validarVersionAnterior(TipoDocumento $tipoAnterior, EstadoDocumento $estadoAnterior, bool $yaReemplazada = false): void
    {
        if ($tipoAnterior !== $this->tipo) {
            throw new TransicionInvalidaException('La versión anterior debe ser del mismo tipo de documento.', 'id_version_anterior');
        }

        if (! $estadoAnterior->admiteVersionPosterior()) {
            throw new TransicionInvalidaException('Solo se puede reemplazar un documento vigente o vencido.', 'id_version_anterior');
        }

        if ($yaReemplazada) {
            throw new TransicionInvalidaException('El documento ya tiene una versión posterior.', 'id_version_anterior');
        }
    }

    /** `true` si la vigencia terminó antes de `$hoy` (la tarea programada lo pasa a `vencido`). */
    public function estaVencido(DateTimeImmutable $hoy): bool
    {
        return $this->fechaVigencia->format('Y-m-d') < $hoy->format('Y-m-d');
    }

    /**
     * @return array<string, mixed>
     */
    public function aArreglo(): array
    {
        return [
            'tipo' => $this->tipo->value,
            'numero' => $this->numero,
            'titulo' => $this->titulo,
            'fecha_emision' => $this->fechaEmision->format('Y-m-d'),
            'id_departamento_emisor' => $this->idDepartamentoEmisor,
            'fecha_vigencia' => $this->fechaVigencia->format('Y-m-d'),
        ];
    }
}
