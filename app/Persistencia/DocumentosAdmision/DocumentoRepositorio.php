<?php

namespace App\Persistencia\DocumentosAdmision;

use App\Dominio\Compartido\Excepciones\NoEncontradoException;
use App\Dominio\Compartido\Paginacion;
use App\Dominio\Compartido\ResultadoPaginado;
use App\Dominio\DocumentosAdmision\DocumentoOficial;
use App\Persistencia\Compartido\Repositorio;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;

/**
 * Documentos oficiales del panel: lecturas con Query Builder y escrituras solo vía `sp_documento_*`.
 */
class DocumentoRepositorio extends Repositorio
{
    private const COLUMNAS = [
        'd.id_documento', 'd.tipo', 'd.numero', 'd.titulo', 'd.fecha_emision', 'd.fecha_vigencia',
        'd.estado', 'd.archivo_pdf', 'd.id_departamento_emisor', 'dp.nombre as departamento',
        'd.id_version_anterior', 'd.id_editor', 'd.id_director_revisa', 'd.fecha_decision', 'd.observaciones_revision',
    ];

    /**
     * @param  array{tipo?: string|null, estado?: string|null, q?: string|null}  $filtros
     * @return ResultadoPaginado<array<string, mixed>>
     */
    public function listar(array $filtros, Paginacion $paginacion): ResultadoPaginado
    {
        $consulta = $this->base()->orderByDesc('d.id_documento');

        if (! empty($filtros['tipo'])) {
            $consulta->where('d.tipo', $filtros['tipo']);
        }

        if (! empty($filtros['estado'])) {
            $consulta->where('d.estado', $filtros['estado']);
        }

        if (! empty($filtros['q'])) {
            $patron = '%'.mb_strtolower((string) $filtros['q']).'%';
            $consulta->where(function ($donde) use ($patron): void {
                $donde->whereRaw('unaccent(lower(d.titulo)) LIKE unaccent(?)', [$patron])
                    ->orWhereRaw('unaccent(lower(d.numero)) LIKE unaccent(?)', [$patron]);
            });
        }

        return $this->paginador->paginar($consulta, $paginacion);
    }

    /**
     * @return array<string, mixed>
     *
     * @throws NoEncontradoException
     */
    public function obtener(int $id): array
    {
        return $this->primeraOFallar($this->base()->where('d.id_documento', $id), 'Documento no encontrado.');
    }

    /**
     * Versiones anteriores (de la más reciente a la más antigua) del documento.
     *
     * @return list<array<string, mixed>>
     */
    public function versionesAnteriores(int $id): array
    {
        return $this->cadena($id, anteriores: true);
    }

    /**
     * Versiones posteriores (de la más cercana a la más reciente) del documento.
     *
     * @return list<array<string, mixed>>
     */
    public function versionesPosteriores(int $id): array
    {
        return $this->cadena($id, anteriores: false);
    }

    /** `true` si otro documento ya reemplaza a este (`id_version_anterior` es único). */
    public function tieneReemplazo(int $id): bool
    {
        return DB::table('documento_oficial')->where('id_version_anterior', $id)->exists();
    }

    public function registrar(int $idEditor, DocumentoOficial $documento, string $rutaPdf, ?int $idVersionAnterior): int
    {
        return (int) $this->sp->escalar('sp_documento_registrar', [
            $idEditor,
            $documento->tipo->value,
            $documento->numero,
            $documento->titulo,
            $documento->fechaEmision->format('Y-m-d'),
            $documento->idDepartamentoEmisor,
            $documento->fechaVigencia->format('Y-m-d'),
            $rutaPdf,
            $idVersionAnterior,
        ]);
    }

    /**
     * @return string|null Ruta del PDF anterior si se reemplazó el archivo.
     */
    public function actualizar(int $idEditor, int $id, DocumentoOficial $documento, ?string $rutaPdf): ?string
    {
        $anterior = $this->sp->escalar('sp_documento_actualizar', [
            $idEditor,
            $id,
            $documento->tipo->value,
            $documento->numero,
            $documento->titulo,
            $documento->fechaEmision->format('Y-m-d'),
            $documento->idDepartamentoEmisor,
            $documento->fechaVigencia->format('Y-m-d'),
            $rutaPdf,
        ]);

        return $anterior === null ? null : (string) $anterior;
    }

    public function reenviar(int $idEditor, int $id): void
    {
        $this->sp->ejecutar('sp_documento_reenviar', [$idEditor, $id]);
    }

    /**
     * @return string Estado nuevo.
     */
    public function decidir(int $idRevisor, int $id, string $decision, ?string $observaciones): string
    {
        return (string) $this->sp->escalar('sp_documento_decidir', [$idRevisor, $id, $decision, $observaciones]);
    }

    /**
     * @return list<array<string, mixed>> Documentos que pasaron a `vencido`.
     */
    public function vencerExpirados(): array
    {
        return $this->sp->filas('sp_documento_vencer_expirados');
    }

    /**
     * @return list<array<string, mixed>> Documentos vigentes que vencen dentro de exactamente `$dias` días.
     */
    public function porVencer(int $dias): array
    {
        return $this->sp->filas('sp_documento_por_vencer', [$dias]);
    }

    private function base(): Builder
    {
        return $this->tabla('documento_oficial as d')
            ->join('departamento as dp', 'dp.id_departamento', '=', 'd.id_departamento_emisor')
            ->select(self::COLUMNAS);
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function cadena(int $id, bool $anteriores): array
    {
        $enlace = $anteriores ? 'd.id_documento = c.id_version_anterior' : 'd.id_version_anterior = c.id_documento';

        $filas = DB::select(
            'WITH RECURSIVE cadena AS (
                SELECT d.id_documento, d.id_version_anterior, 1 AS nivel
                  FROM documento_oficial d
                 WHERE '.($anteriores ? 'd.id_documento = (SELECT id_version_anterior FROM documento_oficial WHERE id_documento = ?)' : 'd.id_version_anterior = ?')."
                UNION ALL
                SELECT d.id_documento, d.id_version_anterior, c.nivel + 1
                  FROM documento_oficial d JOIN cadena c ON {$enlace}
            )
            SELECT c.id_documento, c.nivel, d.tipo::text AS tipo, d.numero, d.titulo, d.estado::text AS estado,
                   d.fecha_emision, d.fecha_vigencia, d.archivo_pdf
              FROM cadena c JOIN documento_oficial d ON d.id_documento = c.id_documento
             ORDER BY c.nivel",
            [$id],
        );

        return array_values(array_map(static fn (object $fila): array => (array) $fila, $filas));
    }
}
