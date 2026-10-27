<?php

namespace App\Console\Commands;

use App\Aplicacion\Usuarios\GestionUsuariosServicio;
use App\Dominio\Compartido\Excepciones\ExcepcionDominio;
use App\Dominio\Usuarios\Rol;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

/**
 * Arranque de cuentas (3.4, paso 7): crea el primer Administrador o Revisor sin solicitud.
 * Imprime la contraseña temporal una sola vez; el usuario debe cambiarla en el primer acceso.
 */
#[Signature('portal:crear-usuario
    {correo : Correo institucional}
    {rol : Editor, Revisor o Administrador}
    {--nombres= : Nombres}
    {--apellidos= : Apellidos}
    {--cargo= : Cargo (opcional), p. ej. "Director de Escuela"}')]
#[Description('Crea un usuario activo (p. ej. el primer Administrador) e imprime su contraseña temporal una sola vez')]
class CrearUsuario extends Command
{
    public function handle(GestionUsuariosServicio $servicio): int
    {
        $rol = Rol::tryFrom((string) $this->argument('rol'));

        if ($rol === null) {
            $this->error('Rol no válido. Use: '.implode(', ', array_column(Rol::cases(), 'value')).'.');

            return self::FAILURE;
        }

        $nombres = trim((string) ($this->option('nombres') ?? ''));
        $apellidos = trim((string) ($this->option('apellidos') ?? ''));

        if ($nombres === '' || $apellidos === '') {
            $this->error('Indique --nombres= y --apellidos=.');

            return self::FAILURE;
        }

        $cargo = $this->option('cargo');

        try {
            $resultado = $servicio->crearInicial(
                (string) $this->argument('correo'),
                $rol,
                $nombres,
                $apellidos,
                is_string($cargo) && trim($cargo) !== '' ? trim($cargo) : null,
            );
        } catch (ExcepcionDominio $error) {
            $this->error($error->getMessage());

            return self::FAILURE;
        }

        $this->info("Usuario #{$resultado['id_usuario']} creado con rol {$rol->value}.");
        $this->line('Contraseña temporal (se muestra una sola vez): '.$resultado['contrasena_temporal']);
        $this->comment('Deberá cambiarla en el primer inicio de sesión.');

        return self::SUCCESS;
    }
}
