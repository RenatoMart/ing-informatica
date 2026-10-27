<?php

namespace Tests\Unit;

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use SplFileInfo;

/**
 * Reglas de dependencia entre capas (docs/DISENO_BACKEND.md, 1.1):
 *
 * - Dominio: solo PHP puro y otras clases de Dominio (sin Illuminate, DB, Carbon ni helpers de Laravel).
 * - Persistencia: Dominio + DB; nunca Aplicación ni HTTP.
 * - Aplicación: Dominio, Persistencia y servicios Laravel; nunca HTTP (Request/Response).
 * - HTTP: Aplicación y objetos de Dominio; nunca Persistencia ni `DB::`.
 */
class ArquitecturaTest extends TestCase
{
    /**
     * @return array<string, array{string, array<string, string>}>
     */
    public static function reglasPorCapa(): array
    {
        $helpersLaravel = '/(?<![\w>:$\\\\])(config|app|now|today|env|request|response|collect|logger|cache|session|auth|storage_path|base_path)\s*\(/';

        return [
            'Dominio' => ['Dominio', [
                'importa Illuminate' => '/\bIlluminate\\\\/',
                'importa Laravel' => '/\bLaravel\\\\/',
                'usa DB::' => '/\bDB::/',
                'usa Carbon' => '/\bCarbon\b/',
                'depende de Persistencia' => '/App\\\\Persistencia\\\\/',
                'depende de Aplicación' => '/App\\\\Aplicacion\\\\/',
                'depende de HTTP' => '/App\\\\Http\\\\/',
                'llama a helpers de Laravel' => $helpersLaravel,
            ]],
            'Persistencia' => ['Persistencia', [
                'depende de Aplicación' => '/App\\\\Aplicacion\\\\/',
                'depende de HTTP' => '/App\\\\Http\\\\/',
                'usa Request' => '/Illuminate\\\\Http\\\\Request\b/',
                'llama a request()' => '/(?<![\w>:$])request\s*\(/',
            ]],
            'Aplicacion' => ['Aplicacion', [
                'depende de HTTP' => '/App\\\\Http\\\\/',
                'usa Request' => '/Illuminate\\\\Http\\\\Request\b/',
                'usa Response' => '/Illuminate\\\\Http\\\\(Json)?Response\b/',
                'llama a request() o response()' => '/(?<![\w>:$])(request|response)\s*\(/',
            ]],
            'Http' => ['Http', [
                'depende de Persistencia' => '/App\\\\Persistencia\\\\/',
                'importa la fachada DB' => '/Illuminate\\\\Support\\\\Facades\\\\DB\b/',
                'usa DB::' => '/\bDB::/',
            ]],
        ];
    }

    /**
     * @param  array<string, string>  $prohibidos
     */
    #[DataProvider('reglasPorCapa')]
    public function test_la_capa_respeta_sus_dependencias(string $carpeta, array $prohibidos): void
    {
        $archivos = $this->archivosPhp(dirname(__DIR__, 2).'/app/'.$carpeta);
        $violaciones = [];

        foreach ($archivos as $archivo) {
            $codigo = $this->codigoSinComentarios((string) file_get_contents($archivo));

            foreach ($prohibidos as $motivo => $patron) {
                if (preg_match($patron, $codigo) === 1) {
                    $violaciones[] = str_replace(dirname(__DIR__, 2).'/', '', $archivo).": {$motivo}";
                }
            }
        }

        $this->assertNotEmpty($archivos, "La capa app/{$carpeta} no tiene archivos PHP.");
        $this->assertSame([], $violaciones, "Violaciones de dependencias en app/{$carpeta}:\n".implode("\n", $violaciones));
    }

    public function test_el_dominio_solo_declara_espacios_de_nombres_de_dominio(): void
    {
        foreach ($this->archivosPhp(dirname(__DIR__, 2).'/app/Dominio') as $archivo) {
            $this->assertMatchesRegularExpression('/^namespace App\\\\Dominio(\\\\[A-Za-z]+)*;$/m', (string) file_get_contents($archivo), $archivo);
        }
    }

    /**
     * @return list<string>
     */
    private function archivosPhp(string $directorio): array
    {
        if (! is_dir($directorio)) {
            return [];
        }

        $archivos = [];

        /** @var SplFileInfo $archivo */
        foreach (new RecursiveIteratorIterator(new RecursiveDirectoryIterator($directorio, RecursiveDirectoryIterator::SKIP_DOTS)) as $archivo) {
            if ($archivo->isFile() && $archivo->getExtension() === 'php') {
                $archivos[] = $archivo->getPathname();
            }
        }

        sort($archivos);

        return $archivos;
    }

    /** Quita comentarios y PHPDoc para no dar falsos positivos con referencias en la documentación. */
    private function codigoSinComentarios(string $codigo): string
    {
        $limpio = '';

        foreach (token_get_all($codigo) as $token) {
            if (is_array($token) && in_array($token[0], [T_COMMENT, T_DOC_COMMENT], true)) {
                continue;
            }

            $limpio .= is_array($token) ? $token[1] : $token;
        }

        return $limpio;
    }
}
