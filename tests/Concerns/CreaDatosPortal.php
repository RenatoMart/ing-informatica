<?php

namespace Tests\Concerns;

use App\Persistencia\Compartido\EjecutorProcedimientos;
use BackedEnum;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use UnitEnum;

/**
 * Datos comunes de las pruebas feature, creados siempre con las funciones `sp_` (sección 9).
 * Cada módulo agrega su propio trait `tests/Concerns/Datos<Modulo>.php` y lo usa junto a este.
 */
trait CreaDatosPortal
{
    /** Contraseña de todos los usuarios de prueba. */
    protected const CONTRASENA_PRUEBA = 'Clave12345';

    /**
     * Crea un usuario activo con `sp_usuario_crear_inicial` y devuelve su `id_usuario`.
     *
     * @param  BackedEnum|UnitEnum|string  $rol  `Editor`, `Revisor` o `Administrador` (o el enum `Rol` de B4).
     * @param  array{nombres?: string, apellidos?: string, correo?: string, cargo?: string|null, contrasena?: string, debe_cambiar_contrasena?: bool}  $extra
     */
    protected function crearUsuario(BackedEnum|UnitEnum|string $rol, array $extra = []): int
    {
        $correo = $extra['correo'] ?? 'usuario'.fake()->unique()->numerify('########').'@'.config('portal.dominio_correo');

        $id = (int) app(EjecutorProcedimientos::class)->escalar('sp_usuario_crear_inicial', [
            $extra['nombres'] ?? fake()->firstName(),
            $extra['apellidos'] ?? fake()->lastName(),
            $correo,
            Hash::make($extra['contrasena'] ?? self::CONTRASENA_PRUEBA),
            $this->nombreRol($rol),
            $extra['cargo'] ?? null,
        ]);

        DB::table('usuario')
            ->where('id_usuario', $id)
            ->update(['debe_cambiar_contrasena' => $extra['debe_cambiar_contrasena'] ?? false]);

        return $id;
    }

    /**
     * Crea un usuario y abre sesión con él en el guard del panel. Devuelve su `id_usuario`.
     *
     * @param  array{nombres?: string, apellidos?: string, correo?: string, cargo?: string|null, contrasena?: string, debe_cambiar_contrasena?: bool}  $extra
     */
    protected function iniciarSesionComo(BackedEnum|UnitEnum|string $rol, array $extra = []): int
    {
        $id = $this->crearUsuario($rol, $extra);

        /** @var class-string<Model&Authenticatable> $modelo */
        $modelo = config('auth.providers.usuarios.model');

        $this->actingAs($modelo::query()->findOrFail($id));

        return $id;
    }

    private function nombreRol(BackedEnum|UnitEnum|string $rol): string
    {
        return match (true) {
            $rol instanceof BackedEnum => (string) $rol->value,
            $rol instanceof UnitEnum => $rol->name,
            default => $rol,
        };
    }
}
