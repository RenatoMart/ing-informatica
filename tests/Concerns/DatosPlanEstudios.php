<?php

namespace Tests\Concerns;

use App\Dominio\Compartido\UsuarioAutenticado;
use App\Persistencia\Compartido\ArgumentoSql;
use App\Persistencia\Compartido\EjecutorProcedimientos;
use Illuminate\Auth\GenericUser;

/**
 * Datos del módulo PlanEstudios, creados siempre con las funciones `sp_`. Se usa junto a {@see CreaDatosPortal}.
 */
trait DatosPlanEstudios
{
    private static int $secuenciaPlan = 0;

    /**
     * Crea el usuario en la BD y abre sesión con un usuario de prueba propio (independiente del modelo de B4).
     */
    protected function iniciarSesionPlan(string $rol): int
    {
        $id = $this->crearUsuario($rol);
        $this->actingAs(new UsuarioPruebaPlan($id, $rol));

        return $id;
    }

    protected function ejecutor(): EjecutorProcedimientos
    {
        return app(EjecutorProcedimientos::class);
    }

    /** Crea un borrador con año/versión únicos y devuelve su id. */
    protected function crearPlanBorrador(int $idEditor): int
    {
        self::$secuenciaPlan++;

        return (int) $this->ejecutor()->escalar('sp_plan_crear', [$idEditor, 2000 + (self::$secuenciaPlan % 99), 'T'.self::$secuenciaPlan]);
    }

    /**
     * @return array{id_curso: int, codigo: string}
     */
    protected function crearCurso(int $idEditor, int $idPlan, string $codigo, int $ciclo = 1, int $creditos = 10): array
    {
        $id = (int) $this->ejecutor()->escalar('sp_curso_guardar', [
            $idEditor, $idPlan, null, $codigo, "Curso {$codigo}", $creditos, 'obligatorio', $ciclo, 'general', 2, 2, null,
        ]);

        return ['id_curso' => $id, 'codigo' => $codigo];
    }

    /** Borrador válido: 2 ciclos con prerrequisito entre ellos y ambos PDF. */
    protected function crearPlanListo(int $idEditor, string $prefijo = 'P'): int
    {
        $idPlan = $this->crearPlanBorrador($idEditor);
        $uno = $this->crearCurso($idEditor, $idPlan, "{$prefijo}1", 1);
        $dos = $this->crearCurso($idEditor, $idPlan, "{$prefijo}2", 2);
        $this->ejecutor()->ejecutar('sp_curso_establecer_prerrequisitos', [
            $idEditor, $dos['id_curso'], ArgumentoSql::arregloEntero([$uno['id_curso']]),
        ]);
        $this->ejecutor()->escalar('sp_plan_adjuntar_pdf', [$idEditor, $idPlan, 'plan', "planes/{$idPlan}/plan-x.pdf"]);
        $this->ejecutor()->escalar('sp_plan_adjuntar_pdf', [$idEditor, $idPlan, 'resolucion', "planes/{$idPlan}/resolucion-x.pdf"]);

        return $idPlan;
    }

    /** Plan listo, enviado a revisión y aprobado por un revisor nuevo. */
    protected function crearPlanPublicado(int $idEditor, bool $comoVigente = true, string $prefijo = 'P'): int
    {
        $idPlan = $this->crearPlanListo($idEditor, $prefijo);
        $this->ejecutor()->ejecutar('sp_plan_enviar_revision', [$idEditor, $idPlan]);
        $idRevisor = $this->crearUsuario('Revisor');
        $this->ejecutor()->escalar('sp_plan_decidir', [$idRevisor, $idPlan, 'aprobar', null, $comoVigente ? 'true' : 'false']);

        return $idPlan;
    }
}

/**
 * Usuario de sesión para las pruebas de este módulo.
 */
class UsuarioPruebaPlan extends GenericUser implements UsuarioAutenticado
{
    public function __construct(private readonly int $idUsuario, private readonly string $rol)
    {
        parent::__construct(['id' => $idUsuario]);
    }

    public function idUsuario(): int
    {
        return $this->idUsuario;
    }

    public function nombreRol(): string
    {
        return $this->rol;
    }

    public function estaActivo(): bool
    {
        return true;
    }

    public function debeCambiarContrasena(): bool
    {
        return false;
    }
}
