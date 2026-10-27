<?php

namespace App\Aplicacion\ConsultasVisitas;

use App\Aplicacion\ConsultasVisitas\Correos\AcuseConsultaMail;
use App\Aplicacion\ConsultasVisitas\Correos\ConsultasVencidasMail;
use App\Aplicacion\ConsultasVisitas\Correos\ReorientacionConsultaMail;
use App\Aplicacion\ConsultasVisitas\Correos\RespuestaConsultaMail;
use App\Dominio\Compartido\Excepciones\ReglaNegocioException;
use App\Dominio\Compartido\Paginacion;
use App\Dominio\Compartido\ResultadoPaginado;
use App\Dominio\ConsultasVisitas\ConsultaContacto;
use App\Persistencia\Compartido\DestinatariosRepositorio;
use App\Persistencia\ConsultasVisitas\ConsultaRepositorio;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

/**
 * Registro (con acuse), clasificación, respuesta y escalamiento de consultas (P4).
 */
class ConsultasServicio
{
    public function __construct(
        private readonly ConsultaRepositorio $repositorio,
        private readonly DestinatariosRepositorio $destinatarios,
    ) {}

    /**
     * Registra la consulta pública y envía el acuse; un fallo de correo no la pierde.
     */
    public function registrar(string $nombre, string $correo, ?string $asunto, string $mensaje): int
    {
        $consulta = new ConsultaContacto($nombre, $correo, $asunto, $mensaje);
        $id = $this->repositorio->registrar($consulta);

        $this->enviar($consulta->correo, new AcuseConsultaMail($consulta->nombre, $id, $consulta->mensaje));

        return $id;
    }

    /**
     * @param  array{estado?: ?string, vencidas?: bool, q?: ?string}  $filtros
     */
    public function listar(array $filtros, Paginacion $paginacion): ResultadoPaginado
    {
        return $this->repositorio->listar($filtros, $paginacion);
    }

    /**
     * @return array<string, mixed>
     */
    public function detalle(int $id): array
    {
        return $this->repositorio->detalle($id);
    }

    /**
     * Si el destino es `externa`, avisa al visitante con `ReorientacionConsultaMail`.
     */
    public function clasificar(int $idEditor, int $id, string $destino, ?int $idDepartamento, ?string $nota): void
    {
        if ($destino === 'area' && $idDepartamento === null) {
            throw new ReglaNegocioException('Indique el departamento responsable.', 'id_departamento');
        }
        if ($destino === 'externa' && trim((string) $nota) === '') {
            throw new ReglaNegocioException('Indique el canal adecuado para el visitante.', 'nota');
        }

        $this->repositorio->clasificar($idEditor, $id, $destino, $idDepartamento, $nota === null ? null : trim($nota));

        if ($destino === 'externa') {
            $contacto = $this->repositorio->contacto($id);
            $this->enviar($contacto['correo'], new ReorientacionConsultaMail($contacto['nombre'], trim((string) $nota)));
        }
    }

    public function responder(int $idEditor, int $id, string $respuesta): void
    {
        $respuesta = trim($respuesta);
        $this->repositorio->responder($idEditor, $id, $respuesta);

        $contacto = $this->repositorio->contacto($id);
        $this->enviar($contacto['correo'], new RespuestaConsultaMail($contacto['nombre'], $respuesta, $contacto['asunto']));
    }

    /**
     * Resumen único a los revisores con las consultas fuera de plazo.
     *
     * @return int Cantidad de consultas vencidas.
     */
    public function escalarVencidas(): int
    {
        $vencidas = $this->repositorio->vencidas();

        if ($vencidas !== []) {
            foreach ($this->destinatarios->correosActivosPorRol('Revisor') as $correo) {
                $this->enviar($correo, new ConsultasVencidasMail($vencidas));
            }
        }

        return count($vencidas);
    }

    private function enviar(string $correo, object $mail): void
    {
        try {
            Mail::to($correo)->send($mail);
        } catch (Throwable $error) {
            Log::warning('No se pudo enviar el correo de consultas.', ['error' => $error->getMessage()]);
        }
    }
}
