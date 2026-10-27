<?php

namespace Tests\Unit\Compartido;

use App\Dominio\Compartido\Excepciones\AccesoDenegadoException;
use App\Dominio\Compartido\Excepciones\ConflictoException;
use App\Dominio\Compartido\Excepciones\ExcepcionDominio;
use App\Dominio\Compartido\Excepciones\NoEncontradoException;
use App\Dominio\Compartido\Excepciones\ReglaNegocioException;
use App\Dominio\Compartido\Excepciones\TransicionInvalidaException;
use App\Dominio\Compartido\Paginacion;
use App\Dominio\Compartido\ResultadoPaginado;
use App\Dominio\Compartido\Url;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class ObjetosCompartidosTest extends TestCase
{
    /**
     * @return array<string, array{ExcepcionDominio, int, string, string}>
     */
    public static function excepciones(): array
    {
        return [
            'regla' => [new ReglaNegocioException('x'), 422, 'REGLA_NEGOCIO', 'RN422'],
            'transicion' => [new TransicionInvalidaException('x'), 409, 'ESTADO_INVALIDO', 'RN409'],
            'conflicto' => [new ConflictoException('x'), 409, 'DUPLICADO', '23505'],
            'no encontrado' => [new NoEncontradoException, 404, 'NO_ENCONTRADO', 'RN404'],
            'acceso' => [new AccesoDenegadoException('x'), 403, 'ROL_NO_AUTORIZADO', 'RN403'],
        ];
    }

    #[DataProvider('excepciones')]
    public function test_cada_excepcion_tiene_su_http_codigo_y_sqlstate(ExcepcionDominio $error, int $http, string $codigo, string $sqlstate): void
    {
        $this->assertSame($http, $error->estadoHttp());
        $this->assertSame($codigo, $error->codigo());
        $this->assertSame($sqlstate, $error->sqlstate());
        $this->assertSame([], $error->campos());
    }

    public function test_la_excepcion_acepta_campo_y_codigo_propio(): void
    {
        $error = new AccesoDenegadoException('Cuenta inactiva.', null, 'CUENTA_INACTIVA');
        $this->assertSame('CUENTA_INACTIVA', $error->codigo());

        $regla = new ReglaNegocioException('El título es obligatorio.', 'titulo');
        $this->assertSame(['titulo' => ['El título es obligatorio.']], $regla->campos());
    }

    public function test_url_https_valida(): void
    {
        $this->assertSame('https://admision.unitru.edu.pe/portal', (string) Url::desde(' https://admision.unitru.edu.pe/portal '));
        $this->assertNull(Url::opcional(''));
    }

    /**
     * @return array<string, array{string}>
     */
    public static function urlsInvalidas(): array
    {
        return [
            'http' => ['http://unitru.edu.pe'],
            'sin esquema' => ['unitru.edu.pe'],
            'vacía' => [''],
            'ftp' => ['ftp://unitru.edu.pe'],
            'muy larga' => ['https://unitru.edu.pe/'.str_repeat('a', 240)],
        ];
    }

    #[DataProvider('urlsInvalidas')]
    public function test_url_invalida_lanza_422_con_el_campo(string $url): void
    {
        try {
            Url::desde($url, 'url_portal');
            $this->fail('Se esperaba ReglaNegocioException.');
        } catch (ReglaNegocioException $error) {
            $this->assertSame('url_portal', $error->campo());
        }
    }

    public function test_paginacion_normaliza_valores(): void
    {
        $defecto = Paginacion::desde();
        $this->assertSame([1, 20, 0], [$defecto->pagina, $defecto->porPagina, $defecto->desplazamiento()]);

        $fuera = Paginacion::desde('-3', '500');
        $this->assertSame([1, 100], [$fuera->pagina, $fuera->porPagina]);

        $texto = Paginacion::desde('abc', 'xyz');
        $this->assertSame([1, 20], [$texto->pagina, $texto->porPagina]);

        $tercera = Paginacion::desde(3, 10);
        $this->assertSame(20, $tercera->desplazamiento());
    }

    public function test_resultado_paginado_tiene_el_formato_de_la_api(): void
    {
        $resultado = (new ResultadoPaginado([['id' => 1], ['id' => 2]], Paginacion::desde(1, 2), 5))
            ->mapear(static fn (array $fila): array => ['id' => $fila['id'] * 10]);

        $this->assertSame([
            'data' => [['id' => 10], ['id' => 20]],
            'meta' => ['pagina' => 1, 'por_pagina' => 2, 'total' => 5, 'ultima_pagina' => 3],
        ], $resultado->aArreglo());

        $vacio = new ResultadoPaginado([], Paginacion::desde(), 0);
        $this->assertSame(1, $vacio->aArreglo()['meta']['ultima_pagina']);
    }
}
