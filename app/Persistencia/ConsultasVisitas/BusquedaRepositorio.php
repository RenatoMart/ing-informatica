<?php

namespace App\Persistencia\ConsultasVisitas;

use App\Persistencia\Compartido\Repositorio;
use App\Persistencia\Docentes\BusquedaTexto;
use Illuminate\Database\Query\Builder;

/**
 * Búsqueda sobre las vistas públicas, sin distinguir mayúsculas ni tildes.
 */
class BusquedaRepositorio extends Repositorio
{
    private const LIMITE = 20;

    /**
     * @return list<array{tipo: string, titulo: string, extracto: string, ruta: string}>
     */
    public function buscar(string $texto): array
    {
        $patron = '%'.BusquedaTexto::patron($texto).'%';
        $coincide = static fn (Builder $q, string $expresion): Builder => $q->whereRaw("translate(lower({$expresion}), 'áéíóúüñ', 'aeiouun') LIKE ?", [$patron]);

        $resultados = [];

        foreach ($this->todas($coincide($this->tabla('v_publico_publicaciones'), "titulo || ' ' || COALESCE(resumen, '') || ' ' || contenido")->orderByDesc('fecha_visible')->limit(self::LIMITE)) as $f) {
            $resultados[] = ['tipo' => 'publicacion', 'titulo' => (string) $f['titulo'], 'extracto' => $this->extracto($f['resumen'] ?? $f['contenido']), 'ruta' => '/noticias/'.$f['id_publicacion']];
        }

        foreach ($this->todas($coincide($this->tabla('v_publico_docentes'), "nombres || ' ' || apellidos || ' ' || COALESCE(curso_principal, '')")->orderBy('apellidos')->limit(self::LIMITE)) as $f) {
            $resultados[] = ['tipo' => 'docente', 'titulo' => trim($f['nombres'].' '.$f['apellidos']), 'extracto' => $this->extracto(trim(($f['grado_academico'] ?? '').' · '.$f['departamento'], ' ·')), 'ruta' => '/organizacion/docentes?q='.rawurlencode((string) $f['apellidos'])];
        }

        foreach ($this->todas($coincide($this->tabla('v_publico_documentos'), "titulo || ' ' || numero")->orderByDesc('fecha_emision')->limit(self::LIMITE)) as $f) {
            $resultados[] = ['tipo' => 'documento', 'titulo' => (string) $f['titulo'], 'extracto' => $this->extracto($f['tipo'].' '.$f['numero']), 'ruta' => (string) $f['archivo_pdf']];
        }

        return array_slice($resultados, 0, self::LIMITE);
    }

    private function extracto(mixed $texto): string
    {
        return mb_substr(trim(strip_tags((string) $texto)), 0, 160);
    }
}
