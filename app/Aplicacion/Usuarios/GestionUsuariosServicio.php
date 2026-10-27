<?php

namespace App\Aplicacion\Usuarios;

use App\Aplicacion\Usuarios\Correos\CredencialesTemporalesMail;
use App\Dominio\Compartido\Excepciones\ConflictoException;
use App\Dominio\Compartido\Paginacion;
use App\Dominio\Compartido\ResultadoPaginado;
use App\Dominio\Usuarios\CorreoInstitucional;
use App\Dominio\Usuarios\Permiso;
use App\Dominio\Usuarios\PoliticaContrasena;
use App\Dominio\Usuarios\ReglasCuentas;
use App\Dominio\Usuarios\Rol;
use App\Dominio\Usuarios\TipoSolicitud;
use App\Persistencia\Usuarios\BitacoraRepositorio;
use App\Persistencia\Usuarios\SolicitudAccesoRepositorio;
use App\Persistencia\Usuarios\UsuarioRepositorio;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

/**
 * Gestión de cuentas (P5): ejecución de solicitudes autorizadas (alta, cambio de rol, baja),
 * edición de datos y consultas. La baja desactiva y revoca sesiones; nunca elimina.
 */
class GestionUsuariosServicio
{
    public function __construct(
        private readonly UsuarioRepositorio $usuarios,
        private readonly SolicitudAccesoRepositorio $solicitudes,
        private readonly BitacoraRepositorio $bitacora,
    ) {}

    /**
     * @param  array{estado?: string|null, rol?: string|null, q?: string|null}  $filtros
     * @return ResultadoPaginado<array<string, mixed>>
     */
    public function listar(int $idActor, array $filtros, Paginacion $paginacion): ResultadoPaginado
    {
        $this->usuarios->buscar($idActor)->exigir(Permiso::VerUsuarios);

        return $this->usuarios->listar($filtros, $paginacion);
    }

    /**
     * Usuario con sus últimas 20 entradas de bitácora.
     *
     * @return array<string, mixed>
     */
    public function ver(int $idActor, int $idUsuario): array
    {
        $this->usuarios->buscar($idActor)->exigir(Permiso::VerUsuarios);

        return [
            ...$this->usuarios->buscar($idUsuario)->aArreglo(),
            'bitacora' => $this->bitacora->ultimasDe($idUsuario, 20),
        ];
    }

    /**
     * @return list<array{id_rol: int, nombre: string, descripcion: string|null}>
     */
    public function roles(): array
    {
        return $this->usuarios->roles();
    }

    /**
     * Alta desde una solicitud autorizada: genera la temporal, guarda su hash y envía las credenciales.
     * Si el correo no se puede enviar, se revierte el alta (la solicitud sigue ejecutable).
     *
     * @return int `id_usuario` creado.
     */
    public function crearDesdeSolicitud(int $idAdmin, int $idSolicitud, string $nombres, string $apellidos, ?string $cargo): int
    {
        $this->usuarios->buscar($idAdmin)->exigir(Permiso::EjecutarSolicitudes);

        $solicitud = $this->solicitudes->buscar($idSolicitud);
        $solicitud->verificarEjecutable(TipoSolicitud::Alta);

        $correo = CorreoInstitucional::desde((string) $solicitud->correoSolicitado, null, 'correo_solicitado');

        if ($this->usuarios->existeCorreo($correo->valor)) {
            throw new ConflictoException('Ya existe un usuario con ese correo institucional.', 'correo_institucional');
        }

        $rol = $this->usuarios->rolPorId((int) $solicitud->idRolSolicitado);
        $temporal = PoliticaContrasena::generarTemporal();

        return DB::transaction(function () use ($idAdmin, $idSolicitud, $nombres, $apellidos, $correo, $temporal, $cargo, $rol): int {
            $id = $this->usuarios->crear($idAdmin, $idSolicitud, $nombres, $apellidos, $correo->valor, Hash::make($temporal), $cargo);

            Mail::to($correo->valor)->send(new CredencialesTemporalesMail(trim($nombres), $correo->valor, $temporal, $rol->etiqueta()));

            return $id;
        });
    }

    /**
     * Alta de arranque por consola (`portal:crear-usuario`): no requiere solicitud.
     *
     * @return array{id_usuario: int, contrasena_temporal: string}
     */
    public function crearInicial(string $correo, Rol $rol, string $nombres, string $apellidos, ?string $cargo): array
    {
        $correo = CorreoInstitucional::desde($correo, (string) config('portal.dominio_correo'));

        if ($this->usuarios->existeCorreo($correo->valor)) {
            throw new ConflictoException('Ya existe un usuario con ese correo institucional.', 'correo_institucional');
        }

        $temporal = PoliticaContrasena::generarTemporal();
        $id = $this->usuarios->crearInicial($nombres, $apellidos, $correo->valor, Hash::make($temporal), $rol, $cargo);

        return ['id_usuario' => $id, 'contrasena_temporal' => $temporal];
    }

    public function actualizarDatos(int $idAdmin, int $idUsuario, string $nombres, string $apellidos, ?string $cargo): void
    {
        $this->usuarios->buscar($idAdmin)->exigir(Permiso::EditarUsuarios);
        $this->usuarios->buscar($idUsuario);

        $this->usuarios->actualizarDatos($idAdmin, $idUsuario, $nombres, $apellidos, $cargo);
    }

    public function cambiarRol(int $idAdmin, int $idUsuario, int $idSolicitud): void
    {
        $this->usuarios->buscar($idAdmin)->exigir(Permiso::EjecutarSolicitudes);

        $solicitud = $this->solicitudes->buscar($idSolicitud);
        $solicitud->verificarEjecutable(TipoSolicitud::CambioRol, $idUsuario);

        ReglasCuentas::verificarCambioRol(
            $this->usuarios->buscar($idUsuario),
            $this->usuarios->rolPorId((int) $solicitud->idRolSolicitado),
            $this->usuarios->contarAdministradoresActivos(),
        );

        $this->usuarios->cambiarRol($idAdmin, $idSolicitud);
    }

    /**
     * Baja = desactivar: la función SQL borra las sesiones del usuario e invalida sus tokens.
     */
    public function desactivar(int $idAdmin, int $idUsuario, int $idSolicitud, ?string $ip): void
    {
        $this->usuarios->buscar($idAdmin)->exigir(Permiso::EjecutarSolicitudes);

        $solicitud = $this->solicitudes->buscar($idSolicitud);
        $solicitud->verificarEjecutable(TipoSolicitud::Baja, $idUsuario);

        ReglasCuentas::verificarBaja($idAdmin, $this->usuarios->buscar($idUsuario), $this->usuarios->contarAdministradoresActivos());

        $this->usuarios->desactivar($idAdmin, $idSolicitud, $ip);
    }
}
