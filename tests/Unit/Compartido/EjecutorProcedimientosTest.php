<?php

namespace Tests\Unit\Compartido;

use App\Dominio\Compartido\Excepciones\AccesoDenegadoException;
use App\Dominio\Compartido\Excepciones\ConflictoException;
use App\Dominio\Compartido\Excepciones\NoEncontradoException;
use App\Dominio\Compartido\Excepciones\ReglaNegocioException;
use App\Dominio\Compartido\Excepciones\TransicionInvalidaException;
use App\Dominio\Revision\TipoDecision;
use App\Persistencia\Compartido\ArgumentoSql;
use App\Persistencia\Compartido\EjecutorProcedimientos;
use App\Persistencia\Compartido\TraductorErroresSql;
use DateTimeImmutable;
use Illuminate\Database\ConnectionInterface;
use Illuminate\Database\QueryException;
use InvalidArgumentException;
use Mockery;
use Mockery\MockInterface;
use PDOException;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class EjecutorProcedimientosTest extends TestCase
{
    protected function tearDown(): void
    {
        Mockery::close();

        parent::tearDown();
    }

    private static function errorSql(string $sqlstate, string $texto): QueryException
    {
        $pdo = new PDOException('SQLSTATE['.$sqlstate.']');
        $pdo->errorInfo = [$sqlstate, 7, $texto];

        return new QueryException('pgsql', 'SELECT sp_x()', [], $pdo);
    }

    /**
     * @return array<string, array{string, string, class-string, string, ?string}>
     */
    public static function erroresSql(): array
    {
        return [
            'RN403' => ['RN403', "ERROR:  No puede revisar contenido que usted editó\nCONTEXT:  PL/pgSQL function", AccesoDenegadoException::class, 'No puede revisar contenido que usted editó', null],
            'RN404' => ['RN404', 'ERROR:  Registro no encontrado', NoEncontradoException::class, 'Registro no encontrado', null],
            'RN409' => ['RN409', "ERROR:  Acción no permitida en estado borrador\nCONTEXT:  ...", TransicionInvalidaException::class, 'Acción no permitida en estado borrador', null],
            'RN422 con campo' => ['RN422', "ERROR:  Prerrequisito circular: A → B → A\nDETAIL:  prerrequisitos\nCONTEXT:  PL/pgSQL function sp_curso_establecer_prerrequisitos", ReglaNegocioException::class, 'Prerrequisito circular: A → B → A', 'prerrequisitos'],
            'RN422 con campo indexado' => ['RN422', "ERROR:  Créditos fuera de rango\nDETAIL:  cursos[3].creditos", ReglaNegocioException::class, 'Créditos fuera de rango', 'cursos[3].creditos'],
            '23505' => ['23505', "ERROR:  duplicate key value violates unique constraint \"uq_curso_plan_codigo\"\nDETAIL:  Key (id_plan, codigo)=(1, 13039) already exists.", ConflictoException::class, 'Ya existe un registro con esos datos.', 'codigo'],
            '23514' => ['23514', 'ERROR:  new row for relation "docente" violates check constraint "ck_renacyt"', ReglaNegocioException::class, 'Los datos no cumplen una regla de integridad.', null],
            '23503' => ['23503', "ERROR:  insert or update violates foreign key constraint\nDETAIL:  Key (id_departamento)=(99) is not present in table \"departamento\".", ReglaNegocioException::class, 'El registro relacionado no existe o está en uso.', 'id_departamento'],
        ];
    }

    /**
     * @param  class-string  $clase
     */
    #[DataProvider('erroresSql')]
    public function test_traduce_errores_sql_a_excepciones_de_dominio(string $sqlstate, string $texto, string $clase, string $mensaje, ?string $campo): void
    {
        $traducida = (new TraductorErroresSql)->traducir(self::errorSql($sqlstate, $texto));

        $this->assertInstanceOf($clase, $traducida);
        $this->assertSame($mensaje, $traducida->getMessage());
        $this->assertSame($campo, $traducida->campo());
    }

    public function test_errores_no_de_negocio_no_se_traducen(): void
    {
        $this->assertNull((new TraductorErroresSql)->traducir(self::errorSql('42P01', 'ERROR:  relation "x" does not exist')));
    }

    private function ejecutorCon(ConnectionInterface $conexion): EjecutorProcedimientos
    {
        return new class($conexion) extends EjecutorProcedimientos
        {
            public function __construct(private readonly ConnectionInterface $falsa)
            {
                parent::__construct();
            }

            protected function conexion(): ConnectionInterface
            {
                return $this->falsa;
            }
        };
    }

    public function test_escalar_construye_la_llamada_y_normaliza_argumentos(): void
    {
        /** @var ConnectionInterface&MockInterface $conexion */
        $conexion = Mockery::mock(ConnectionInterface::class);
        $conexion->shouldReceive('selectOne')
            ->once()
            ->with(
                'SELECT sp_plan_decidir(?, ?, ?, ?, ?, ?::text[], ?::int[], ?::jsonb) AS resultado',
                [3, 'aprobar', null, 'true', '2026-10-27T10:00:00-05:00', '{"a\"b","c"}', '{1,2}', '{"x":"ñ"}'],
            )
            ->andReturn((object) ['resultado' => 'vigente']);

        $resultado = $this->ejecutorCon($conexion)->escalar('sp_plan_decidir', [
            3,
            TipoDecision::Aprobar,
            null,
            true,
            new DateTimeImmutable('2026-10-27T10:00:00-05:00'),
            ArgumentoSql::arregloTexto(['a"b', 'c']),
            ArgumentoSql::arregloEntero([1, 2]),
            ArgumentoSql::json(['x' => 'ñ']),
        ]);

        $this->assertSame('vigente', $resultado);
    }

    public function test_filas_devuelve_arreglos(): void
    {
        /** @var ConnectionInterface&MockInterface $conexion */
        $conexion = Mockery::mock(ConnectionInterface::class);
        $conexion->shouldReceive('select')
            ->once()
            ->with('SELECT * FROM sp_plan_validar(?)', [7])
            ->andReturn([(object) ['nivel' => 'error', 'codigo' => 'SIN_CURSOS', 'mensaje' => 'El plan no tiene cursos.']]);

        $this->assertSame(
            [['nivel' => 'error', 'codigo' => 'SIN_CURSOS', 'mensaje' => 'El plan no tiene cursos.']],
            $this->ejecutorCon($conexion)->filas('sp_plan_validar', [7]),
        );
    }

    public function test_traduce_la_excepcion_de_la_conexion(): void
    {
        /** @var ConnectionInterface&MockInterface $conexion */
        $conexion = Mockery::mock(ConnectionInterface::class);
        $conexion->shouldReceive('selectOne')->andThrow(self::errorSql('RN409', 'ERROR:  Acción no permitida en estado vigente'));

        $this->expectException(TransicionInvalidaException::class);
        $this->expectExceptionMessage('Acción no permitida en estado vigente');

        $this->ejecutorCon($conexion)->ejecutar('sp_plan_actualizar', [1, 2, 2026, 'v2']);
    }

    public function test_relanza_errores_que_no_son_de_negocio(): void
    {
        /** @var ConnectionInterface&MockInterface $conexion */
        $conexion = Mockery::mock(ConnectionInterface::class);
        $conexion->shouldReceive('selectOne')->andThrow(self::errorSql('42883', 'ERROR:  function sp_x() does not exist'));

        $this->expectException(QueryException::class);

        $this->ejecutorCon($conexion)->escalar('sp_x');
    }

    public function test_rechaza_nombres_de_funcion_no_permitidos(): void
    {
        $this->expectException(InvalidArgumentException::class);

        $this->ejecutorCon(Mockery::mock(ConnectionInterface::class))->escalar('pg_sleep(10); --');
    }
}
