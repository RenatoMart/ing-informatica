<?php

namespace Tests\Unit\Revision;

use App\Dominio\Compartido\Excepciones\TransicionInvalidaException;
use App\Dominio\Revision\AccionRevision;
use App\Dominio\Revision\ActorRevision;
use App\Dominio\Revision\EntidadRevisable;
use App\Dominio\Revision\MaquinaEstadosRevision;
use App\Dominio\Revision\OperacionPendiente;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * Tabla 2.2 escrita a mano (independiente de las políticas) y comparada en todas las combinaciones.
 */
class MaquinaEstadosRevisionTest extends TestCase
{
    /**
     * Copia literal de la sección 2.2: [entidad, desde, operación, acción, hacia, operación resultante, actor].
     *
     * @return list<array{string, ?string, ?string, string, string, ?string, string}>
     */
    private static function tablaEsperada(): array
    {
        return [
            ['publicacion', null, null, 'guardar', 'borrador', null, 'E'],
            ['publicacion', 'borrador', null, 'guardar', 'borrador', null, 'E'],
            ['publicacion', 'borrador', null, 'enviar_revision', 'en_revision', null, 'E'],
            ['publicacion', 'borrador', null, 'descartar', 'descartada', null, 'E'],
            ['publicacion', 'en_revision', null, 'aprobar', 'publicada', null, 'R'],
            ['publicacion', 'en_revision', null, 'observar', 'borrador', null, 'R'],
            ['publicacion', 'en_revision', null, 'descartar', 'descartada', null, 'R'],
            ['publicacion', 'publicada', null, 'proponer_cambio', 'publicada', 'cambio', 'E'],
            ['publicacion', 'publicada', 'cambio', 'proponer_cambio', 'publicada', 'cambio', 'E'],
            ['publicacion', 'publicada', null, 'solicitar_baja', 'publicada', 'baja', 'E'],
            ['publicacion', 'publicada', 'cambio', 'aprobar', 'publicada', null, 'R'],
            ['publicacion', 'publicada', 'baja', 'aprobar', 'despublicada', null, 'R'],
            ['publicacion', 'publicada', 'cambio', 'observar', 'publicada', null, 'R'],
            ['publicacion', 'publicada', 'cambio', 'descartar', 'publicada', null, 'R'],
            ['publicacion', 'publicada', 'baja', 'observar', 'publicada', null, 'R'],
            ['publicacion', 'publicada', 'baja', 'descartar', 'publicada', null, 'R'],

            ['docente', null, null, 'guardar', 'borrador', null, 'E'],
            ['docente', 'borrador', null, 'guardar', 'borrador', null, 'E'],
            ['docente', 'borrador', null, 'enviar_revision', 'en_revision', null, 'E'],
            ['docente', 'en_revision', null, 'aprobar', 'publicado', null, 'R'],
            ['docente', 'en_revision', null, 'observar', 'borrador', null, 'R'],
            ['docente', 'publicado', null, 'proponer_cambio', 'publicado', 'cambio', 'E'],
            ['docente', 'publicado', 'cambio', 'proponer_cambio', 'publicado', 'cambio', 'E'],
            ['docente', 'publicado', null, 'solicitar_baja', 'publicado', 'baja', 'E'],
            ['docente', 'publicado', 'cambio', 'aprobar', 'publicado', null, 'R'],
            ['docente', 'publicado', 'baja', 'aprobar', 'inactivo', null, 'R'],
            ['docente', 'publicado', 'cambio', 'observar', 'publicado', null, 'R'],
            ['docente', 'publicado', 'baja', 'observar', 'publicado', null, 'R'],
            ['docente', 'inactivo', null, 'reactivar', 'borrador', null, 'E'],

            ['plan', null, null, 'guardar', 'borrador', null, 'E'],
            ['plan', 'borrador', null, 'guardar', 'borrador', null, 'E'],
            ['plan', 'borrador', null, 'enviar_revision', 'en_revision', null, 'E'],
            ['plan', 'en_revision', null, 'aprobar', 'vigente', null, 'R'],
            ['plan', 'en_revision', null, 'observar', 'borrador', null, 'R'],
            ['plan', 'en_revision', null, 'descartar', 'descartado', null, 'R'],
            ['plan', 'vigente', null, 'reemplazar_vigente', 'historico', null, 'S'],

            ['documento', null, null, 'guardar', 'en_revision', null, 'E'],
            ['documento', 'en_revision', null, 'aprobar', 'vigente', null, 'R'],
            ['documento', 'en_revision', null, 'observar', 'no_publicado', null, 'R'],
            ['documento', 'en_revision', null, 'descartar', 'no_publicado', null, 'R'],
            ['documento', 'no_publicado', null, 'guardar', 'no_publicado', null, 'E'],
            ['documento', 'no_publicado', null, 'reenviar', 'en_revision', null, 'E'],
            ['documento', 'vigente', null, 'vencer', 'vencido', null, 'S'],
            ['documento', 'vigente', null, 'reemplazar_vigente', 'historico', null, 'S'],
            ['documento', 'vencido', null, 'reemplazar_vigente', 'historico', null, 'S'],

            ['campana', null, null, 'guardar', 'borrador', null, 'E'],
            ['campana', 'borrador', null, 'guardar', 'borrador', null, 'E'],
            ['campana', 'borrador', null, 'enviar_revision', 'en_revision', null, 'E'],
            ['campana', 'en_revision', null, 'aprobar', 'vigente', null, 'R'],
            ['campana', 'en_revision', null, 'observar', 'borrador', null, 'R'],
            ['campana', 'vigente', null, 'cerrar', 'cerrada', null, 'S'],
            ['campana', 'vigente', null, 'reemplazar_vigente', 'archivada', null, 'S'],
            ['campana', 'cerrada', null, 'reemplazar_vigente', 'archivada', null, 'S'],
        ];
    }

    /**
     * @return array<string, array{string, ?string, ?string, string, string, ?string, string}>
     */
    public static function transicionesValidas(): array
    {
        $casos = [];

        foreach (self::tablaEsperada() as $fila) {
            $casos[sprintf('%s: %s%s + %s', $fila[0], $fila[1] ?? '(nuevo)', $fila[2] ? " ({$fila[2]})" : '', $fila[3])] = $fila;
        }

        return $casos;
    }

    /**
     * Al menos tres combinaciones inválidas por entidad (sección 9), con su motivo.
     *
     * @return array<string, array{string, ?string, ?string, string}>
     */
    public static function transicionesInvalidas(): array
    {
        return [
            'publicacion: aprobar un borrador' => ['publicacion', 'borrador', null, 'aprobar'],
            'publicacion: enviar estando en revisión' => ['publicacion', 'en_revision', null, 'enviar_revision'],
            'publicacion: solicitar baja con cambio pendiente' => ['publicacion', 'publicada', 'cambio', 'solicitar_baja'],
            'publicacion: proponer cambio con baja pendiente' => ['publicacion', 'publicada', 'baja', 'proponer_cambio'],
            'publicacion: reactivar una despublicada' => ['publicacion', 'despublicada', null, 'reactivar'],
            'publicacion: aprobar publicada sin operación' => ['publicacion', 'publicada', null, 'aprobar'],
            'docente: descartar en revisión' => ['docente', 'en_revision', null, 'descartar'],
            'docente: descartar un cambio pendiente' => ['docente', 'publicado', 'cambio', 'descartar'],
            'docente: reactivar un publicado' => ['docente', 'publicado', null, 'reactivar'],
            'docente: descartar un borrador' => ['docente', 'borrador', null, 'descartar'],
            'plan: editar un plan vigente' => ['plan', 'vigente', null, 'guardar'],
            'plan: proponer cambio (no usa operaciones)' => ['plan', 'vigente', null, 'proponer_cambio'],
            'plan: enviar un descartado' => ['plan', 'descartado', null, 'enviar_revision'],
            'documento: guardar en revisión' => ['documento', 'en_revision', null, 'guardar'],
            'documento: vencer en revisión' => ['documento', 'en_revision', null, 'vencer'],
            'documento: reenviar un vigente' => ['documento', 'vigente', null, 'reenviar'],
            'campana: descartar en revisión' => ['campana', 'en_revision', null, 'descartar'],
            'campana: cerrar un borrador' => ['campana', 'borrador', null, 'cerrar'],
            'campana: editar una vigente' => ['campana', 'vigente', null, 'guardar'],
        ];
    }

    #[DataProvider('transicionesValidas')]
    public function test_transicion_valida_de_la_tabla(string $entidad, ?string $desde, ?string $operacion, string $accion, string $hacia, ?string $operacionResultante, string $actor): void
    {
        $transicion = (new MaquinaEstadosRevision)->transicion(
            EntidadRevisable::from($entidad),
            $desde,
            OperacionPendiente::tryFrom((string) $operacion),
            AccionRevision::from($accion),
        );

        $this->assertSame($hacia, $transicion->hacia);
        $this->assertSame(OperacionPendiente::tryFrom((string) $operacionResultante), $transicion->operacionResultante);
        $this->assertSame(ActorRevision::from($actor), $transicion->actor);
    }

    #[DataProvider('transicionesInvalidas')]
    public function test_transicion_invalida_lanza_409(string $entidad, ?string $desde, ?string $operacion, string $accion): void
    {
        $this->expectException(TransicionInvalidaException::class);

        (new MaquinaEstadosRevision)->siguiente(
            EntidadRevisable::from($entidad),
            $desde,
            OperacionPendiente::tryFrom((string) $operacion),
            AccionRevision::from($accion),
        );
    }

    /**
     * Recorre todas las combinaciones (entidad × estado|nuevo × operación|— × acción): solo las de la tabla
     * esperada son válidas y devuelven el mismo destino.
     */
    public function test_todas_las_combinaciones_coinciden_con_la_tabla_2_2(): void
    {
        $maquina = new MaquinaEstadosRevision;
        $esperadas = [];

        foreach (self::tablaEsperada() as [$entidad, $desde, $operacion, $accion, $hacia]) {
            $esperadas[$entidad.'|'.($desde ?? '-').'|'.($operacion ?? '-').'|'.$accion] = $hacia;
        }

        $combinaciones = 0;

        foreach (EntidadRevisable::cases() as $entidad) {
            foreach ([null, ...$entidad->politica()->estados()] as $estado) {
                foreach ([null, ...OperacionPendiente::cases()] as $operacion) {
                    foreach (AccionRevision::cases() as $accion) {
                        $clave = $entidad->value.'|'.($estado ?? '-').'|'.($operacion->value ?? '-').'|'.$accion->value;
                        $combinaciones++;

                        if (isset($esperadas[$clave])) {
                            $this->assertSame($esperadas[$clave], $maquina->siguiente($entidad, $estado, $operacion, $accion), $clave);
                            unset($esperadas[$clave]);

                            continue;
                        }

                        $this->assertFalse($maquina->permite($entidad, $estado, $operacion, $accion), "No debería permitirse: {$clave}");
                    }
                }
            }
        }

        $this->assertSame([], $esperadas, 'Filas de la tabla con estados desconocidos para la política.');
        $this->assertSame(1044, $combinaciones);
    }

    public function test_la_politica_no_declara_filas_fuera_de_la_tabla(): void
    {
        $this->assertCount(
            count(self::tablaEsperada()),
            array_merge(...array_map(
                static fn (EntidadRevisable $entidad): array => $entidad->politica()->transiciones(),
                EntidadRevisable::cases(),
            )),
        );
    }

    public function test_aprobar_plan_como_consultable_lo_deja_historico(): void
    {
        $maquina = new MaquinaEstadosRevision;

        $this->assertSame('vigente', $maquina->siguiente(EntidadRevisable::Plan, 'en_revision', null, AccionRevision::Aprobar));
        $this->assertSame('historico', $maquina->siguiente(EntidadRevisable::Plan, 'en_revision', null, AccionRevision::Aprobar, comoVigente: false));
        $this->assertSame('publicada', $maquina->siguiente(EntidadRevisable::Publicacion, 'en_revision', null, AccionRevision::Aprobar, comoVigente: false));
    }

    public function test_mensaje_de_transicion_invalida_indica_estado_y_operacion(): void
    {
        try {
            (new MaquinaEstadosRevision)->siguiente(EntidadRevisable::Publicacion, 'publicada', OperacionPendiente::Baja, AccionRevision::ProponerCambio);
            $this->fail('Se esperaba TransicionInvalidaException.');
        } catch (TransicionInvalidaException $error) {
            $this->assertSame('Acción no permitida en estado publicada (baja pendiente).', $error->getMessage());
            $this->assertSame(409, $error->estadoHttp());
            $this->assertSame('ESTADO_INVALIDO', $error->codigo());
        }
    }

    public function test_acciones_permitidas_desde_un_estado(): void
    {
        $acciones = (new MaquinaEstadosRevision)->accionesPermitidas(EntidadRevisable::Publicacion, 'borrador', null);

        $this->assertSame(
            [AccionRevision::Guardar, AccionRevision::EnviarRevision, AccionRevision::Descartar],
            $acciones,
        );
    }
}
