<?php

namespace Tests\Unit\Usuarios;

use App\Dominio\Compartido\Excepciones\ReglaNegocioException;
use App\Dominio\Compartido\Excepciones\TransicionInvalidaException;
use App\Dominio\Usuarios\CorreoInstitucional;
use App\Dominio\Usuarios\EstadoSolicitud;
use App\Dominio\Usuarios\EstadoUsuario;
use App\Dominio\Usuarios\Permiso;
use App\Dominio\Usuarios\PoliticaContrasena;
use App\Dominio\Usuarios\ReglasCuentas;
use App\Dominio\Usuarios\Rol;
use App\Dominio\Usuarios\SolicitudAcceso;
use App\Dominio\Usuarios\TipoSolicitud;
use App\Dominio\Usuarios\TokenRecuperacion;
use App\Dominio\Usuarios\Usuario;
use PHPUnit\Framework\TestCase;

/**
 * Dominio puro del módulo Usuarios (sin BD ni Laravel).
 */
class DominioUsuariosTest extends TestCase
{
    public function test_politica_de_contrasena(): void
    {
        PoliticaContrasena::validar('ClaveSegura1', 'ana@unitru.edu.pe');

        foreach (['corta1', 'sololetrasmuchas', '12345678901'] as $invalida) {
            try {
                PoliticaContrasena::validar($invalida);
                $this->fail("Debió rechazar {$invalida}");
            } catch (ReglaNegocioException $error) {
                $this->assertSame('contrasena_nueva', $error->campo());
            }
        }

        $this->expectException(ReglaNegocioException::class);
        PoliticaContrasena::validar('ClaveSegura1', null, true);
    }

    public function test_contrasena_igual_al_correo_se_rechaza(): void
    {
        $this->expectException(ReglaNegocioException::class);
        PoliticaContrasena::validar('ana.ruiz2026', 'ANA.RUIZ2026@unitru.edu.pe');
    }

    public function test_temporal_cumple_la_politica_y_no_tiene_ambiguos(): void
    {
        for ($i = 0; $i < 50; $i++) {
            $temporal = PoliticaContrasena::generarTemporal();
            $this->assertSame(12, strlen($temporal));
            $this->assertDoesNotMatchRegularExpression('/[0O1lIo]/', $temporal);
            PoliticaContrasena::validar($temporal);
        }
    }

    public function test_correo_institucional(): void
    {
        $this->assertSame('ana@unitru.edu.pe', CorreoInstitucional::desde('  Ana@UNITRU.edu.pe ', 'unitru.edu.pe')->valor);
        $this->assertSame('x@otro.pe', CorreoInstitucional::desde('x@otro.pe', null)->valor);

        $this->expectException(ReglaNegocioException::class);
        CorreoInstitucional::desde('ana@gmail.com', 'unitru.edu.pe');
    }

    public function test_correo_con_formato_invalido(): void
    {
        $this->expectException(ReglaNegocioException::class);
        CorreoInstitucional::desde('no-es-correo', null);
    }

    public function test_token_de_recuperacion(): void
    {
        $token = TokenRecuperacion::generar();

        $this->assertMatchesRegularExpression('/^[0-9a-f]{64}$/', $token->valor);
        $this->assertSame(hash('sha256', $token->valor), TokenRecuperacion::desde(strtoupper($token->valor))->hash());

        $this->expectException(ReglaNegocioException::class);
        TokenRecuperacion::desde('abc');
    }

    public function test_matriz_de_permisos(): void
    {
        $this->assertFalse(Rol::Editor->tienePermiso(Permiso::VerUsuarios));
        $this->assertTrue(Rol::Revisor->tienePermiso(Permiso::ResolverSolicitudes));
        $this->assertTrue(Rol::Revisor->tienePermiso(Permiso::EditarContenido));
        $this->assertFalse(Rol::Revisor->tienePermiso(Permiso::EjecutarSolicitudes));
        $this->assertTrue(Rol::Administrador->tienePermiso(Permiso::EjecutarSolicitudes));
        $this->assertFalse(Rol::Administrador->tienePermiso(Permiso::DecidirRevision));
        $this->assertFalse(Rol::Administrador->tienePermiso(Permiso::ResolverSolicitudes));
        $this->assertFalse($this->usuario(1, Rol::Administrador, EstadoUsuario::Inactivo)->puede(Permiso::VerUsuarios));
    }

    public function test_reglas_de_baja_y_cambio_de_rol(): void
    {
        $admin = $this->usuario(1, Rol::Administrador);

        $this->assertExcepcion(fn () => ReglasCuentas::verificarBaja(1, $admin, 2), 'No puede darse de baja a sí mismo.');
        $this->assertExcepcion(fn () => ReglasCuentas::verificarBaja(2, $admin, 1), 'No se puede dar de baja al último Administrador activo.');
        $this->assertExcepcion(fn () => ReglasCuentas::verificarCambioRol($admin, Rol::Editor, 1), 'No se puede quitar el rol al último Administrador activo.');
        $this->assertExcepcion(fn () => ReglasCuentas::verificarCambioRol($admin, Rol::Administrador, 3), 'El usuario ya tiene ese rol.');

        ReglasCuentas::verificarBaja(2, $admin, 2);
        ReglasCuentas::verificarCambioRol($this->usuario(3, Rol::Editor), Rol::Revisor, 1);
        $this->addToAssertionCount(2);
    }

    public function test_solicitud_por_tipo_y_ejecucion(): void
    {
        $alta = SolicitudAcceso::nueva('Ana', TipoSolicitud::Alta, 1, null, CorreoInstitucional::desde('ana@unitru.edu.pe', null), 9);
        $this->assertNull($alta->idUsuarioObjetivo);
        $this->assertSame('ana@unitru.edu.pe', $alta->correoSolicitado);

        try {
            SolicitudAcceso::nueva('Ana', TipoSolicitud::Alta, 1, null, null, null);
            $this->fail('El alta exige correo.');
        } catch (ReglaNegocioException $error) {
            $this->assertSame('correo_solicitado', $error->campo());
        }

        try {
            SolicitudAcceso::nueva('Ana', TipoSolicitud::Baja, null, null, null, null);
            $this->fail('La baja exige usuario objetivo.');
        } catch (ReglaNegocioException $error) {
            $this->assertSame('id_usuario_objetivo', $error->campo());
        }

        $autorizada = new SolicitudAcceso(5, 'Ana', TipoSolicitud::Baja, 1, null, EstadoSolicitud::Autorizada, null, 7);
        $autorizada->verificarEjecutable(TipoSolicitud::Baja, 7);
        $this->assertExcepcion(fn () => $autorizada->verificarEjecutable(TipoSolicitud::Baja, 8), 'La solicitud #5 corresponde a otro usuario.');
        $this->assertExcepcion(fn () => $autorizada->verificarEjecutable(TipoSolicitud::Alta), 'La solicitud #5 no es de alta.');

        $ejecutada = new SolicitudAcceso(6, 'Ana', TipoSolicitud::Alta, 1, null, EstadoSolicitud::Autorizada, 'a@b.pe', null, true);
        $this->assertExcepcion(fn () => $ejecutada->verificarEjecutable(TipoSolicitud::Alta), 'La solicitud #6 ya fue ejecutada.');

        $pendiente = new SolicitudAcceso(7, 'Ana', TipoSolicitud::Alta, 1, null, EstadoSolicitud::Pendiente, 'a@b.pe', null);
        $this->assertExcepcion(fn () => $pendiente->verificarEjecutable(TipoSolicitud::Alta), 'La solicitud #7 no está autorizada.');
        $pendiente->verificarResoluble();
        $this->assertExcepcion(fn () => $autorizada->verificarResoluble(), 'La solicitud ya fue resuelta.');
    }

    private function usuario(int $id, Rol $rol, EstadoUsuario $estado = EstadoUsuario::Activo): Usuario
    {
        return new Usuario($id, 'N', 'A', "u{$id}@unitru.edu.pe", $rol, $estado, null, false);
    }

    private function assertExcepcion(callable $accion, string $mensaje): void
    {
        try {
            $accion();
            $this->fail("Se esperaba: {$mensaje}");
        } catch (TransicionInvalidaException $error) {
            $this->assertSame($mensaje, $error->getMessage());
        }
    }
}
