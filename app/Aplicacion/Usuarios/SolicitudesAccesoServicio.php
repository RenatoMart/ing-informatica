<?php

namespace App\Aplicacion\Usuarios;

use App\Dominio\Compartido\Excepciones\ConflictoException;
use App\Dominio\Compartido\Excepciones\ReglaNegocioException;
use App\Dominio\Compartido\Paginacion;
use App\Dominio\Compartido\ResultadoPaginado;
use App\Dominio\Usuarios\CorreoInstitucional;
use App\Dominio\Usuarios\Permiso;
use App\Dominio\Usuarios\SolicitudAcceso;
use App\Dominio\Usuarios\TipoSolicitud;
use App\Persistencia\Usuarios\SolicitudAccesoRepositorio;
use App\Persistencia\Usuarios\UsuarioRepositorio;

/**
 * Solicitudes de acceso (P5): las registra el Administrador o el Revisor y las resuelve el Revisor.
 */
class SolicitudesAccesoServicio
{
    public function __construct(
        private readonly SolicitudAccesoRepositorio $solicitudes,
        private readonly UsuarioRepositorio $usuarios,
    ) {}

    /**
     * @param  array{estado?: string|null, tipo?: string|null}  $filtros
     * @return ResultadoPaginado<array<string, mixed>>
     */
    public function listar(int $idActor, array $filtros, Paginacion $paginacion): ResultadoPaginado
    {
        $this->usuarios->buscar($idActor)->exigir(Permiso::VerUsuarios);

        return $this->solicitudes->listar($filtros, $paginacion);
    }

    /**
     * @param  array{solicitante_nombre: string, tipo_solicitud: string, id_rol_solicitado?: int|null, motivo?: string|null, correo_solicitado?: string|null, id_usuario_objetivo?: int|null}  $datos
     * @return int `id_solicitud`
     */
    public function registrar(int $idActor, array $datos): int
    {
        $this->usuarios->buscar($idActor)->exigir(Permiso::RegistrarSolicitudes);

        $tipo = TipoSolicitud::tryFrom($datos['tipo_solicitud'])
            ?? throw new ReglaNegocioException('Tipo de solicitud no válido.', 'tipo_solicitud');

        $correo = null;

        if ($tipo === TipoSolicitud::Alta && ($datos['correo_solicitado'] ?? null) !== null) {
            $correo = CorreoInstitucional::desde($datos['correo_solicitado'], (string) config('portal.dominio_correo'), 'correo_solicitado');

            if ($this->usuarios->existeCorreo($correo->valor)) {
                throw new ConflictoException('Ya existe un usuario con ese correo institucional.', 'correo_solicitado');
            }
        }

        $solicitud = SolicitudAcceso::nueva(
            $datos['solicitante_nombre'],
            $tipo,
            $datos['id_rol_solicitado'] ?? null,
            $datos['motivo'] ?? null,
            $correo,
            $datos['id_usuario_objetivo'] ?? null,
        );

        if ($tipo !== TipoSolicitud::Alta) {
            $this->usuarios->buscar((int) $solicitud->idUsuarioObjetivo);
        }

        return $this->solicitudes->registrar($idActor, $solicitud);
    }

    public function autorizar(int $idRevisor, int $idSolicitud, ?string $observacion): void
    {
        $this->resolver($idRevisor, $idSolicitud, true, $observacion);
    }

    public function denegar(int $idRevisor, int $idSolicitud, string $observacion): void
    {
        $this->resolver($idRevisor, $idSolicitud, false, $observacion);
    }

    private function resolver(int $idRevisor, int $idSolicitud, bool $autorizar, ?string $observacion): void
    {
        $this->usuarios->buscar($idRevisor)->exigir(Permiso::ResolverSolicitudes);
        $this->solicitudes->buscar($idSolicitud)->verificarResoluble();

        $this->solicitudes->resolver($idRevisor, $idSolicitud, $autorizar, $observacion);
    }
}
