<?php

namespace Tests\Concerns;

use App\Persistencia\Compartido\EjecutorProcedimientos;
use App\Persistencia\Usuarios\UsuarioAutenticable;
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;
use Illuminate\Support\Facades\DB;

/**
 * Datos del módulo Usuarios (B4). Se usa junto a {@see CreaDatosPortal}; todo por las funciones `sp_`.
 */
trait DatosUsuarios
{
    /** Roles base (los crea 03_datos_iniciales.sql en los entornos reales; las migraciones de pruebas no). */
    protected function sembrarRoles(): void
    {
        DB::statement("INSERT INTO rol (nombre, descripcion) VALUES
            ('Editor', 'Editor de contenidos'), ('Revisor', 'Director de Escuela'), ('Administrador', 'Gestiona usuarios')
            ON CONFLICT (nombre) DO NOTHING");
    }

    protected function idRol(string $nombre): int
    {
        return (int) DB::table('rol')->where('nombre', $nombre)->value('id_rol');
    }

    protected function correoPrueba(string $usuario): string
    {
        return $usuario.'@'.config('portal.dominio_correo');
    }

    /** Abre sesión con un usuario ya creado (modelo del guard, releído de la BD). */
    protected function actuarComo(int $idUsuario): static
    {
        return $this->actingAs(UsuarioAutenticable::query()->findOrFail($idUsuario));
    }

    /**
     * Registra una solicitud con `sp_solicitud_registrar` y, si se indica, la autoriza con `sp_solicitud_resolver`.
     */
    protected function crearSolicitud(
        int $idActor,
        string $tipo,
        ?int $idRol,
        ?string $correo = null,
        ?int $idObjetivo = null,
        ?int $idRevisorQueAutoriza = null,
    ): int {
        $sp = app(EjecutorProcedimientos::class);
        $id = (int) $sp->escalar('sp_solicitud_registrar', [$idActor, 'Solicitante de prueba', $tipo, $idRol, 'Prueba', $correo, $idObjetivo]);

        if ($idRevisorQueAutoriza !== null) {
            $sp->ejecutar('sp_solicitud_resolver', [$idRevisorQueAutoriza, $id, true, 'Conforme']);
        }

        return $id;
    }

    protected function contarBitacora(int $idUsuario, string $accion): int
    {
        return DB::table('bitacora_acceso')->where('id_usuario', $idUsuario)->where('accion', $accion)->count();
    }

    /** Reactiva la verificación CSRF, que Laravel omite al correr pruebas. */
    protected function activarCsrf(): void
    {
        $this->app->bind(PreventRequestForgery::class, fn ($app): PreventRequestForgery => new class($app, $app['encrypter']) extends PreventRequestForgery
        {
            protected function runningUnitTests(): bool
            {
                return false;
            }
        });
    }
}
