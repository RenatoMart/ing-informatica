<?php

namespace App\Aplicacion\Compartido;

use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Throwable;

/**
 * Comprueba que un enlace externo responde: `HEAD` (y `GET` si el servidor responde 405),
 * con timeout de 5 s y redirecciones. Operativo = código entre 200 y 399.
 */
class VerificadorEnlaces
{
    public function verificar(string $url): EstadoEnlace
    {
        try {
            $respuesta = $this->solicitar('head', $url);

            if ($respuesta->status() === 405) {
                $respuesta = $this->solicitar('get', $url);
            }

            $estado = $respuesta->status();

            return new EstadoEnlace($estado >= 200 && $estado < 400, $estado);
        } catch (Throwable) {
            return new EstadoEnlace(false, null);
        }
    }

    /**
     * Verifica varios enlaces conservando las claves (p. ej. `url_portal`, `url_estadisticas`).
     *
     * @param  array<string, string|null>  $urls
     * @return array<string, EstadoEnlace>
     */
    public function verificarVarios(array $urls): array
    {
        $resultados = [];

        foreach ($urls as $clave => $url) {
            $resultados[$clave] = $url === null || trim($url) === ''
                ? new EstadoEnlace(false, null)
                : $this->verificar($url);
        }

        return $resultados;
    }

    private function solicitar(string $metodo, string $url): Response
    {
        $segundos = (int) config('portal.enlaces.timeout_segundos', 5);

        $cliente = Http::timeout($segundos)
            ->connectTimeout($segundos)
            ->withOptions(['allow_redirects' => ['max' => 5]])
            ->withUserAgent('PortalEscuelaInformaticaUNT/1.0');

        return $metodo === 'head' ? $cliente->head($url) : $cliente->get($url);
    }
}
