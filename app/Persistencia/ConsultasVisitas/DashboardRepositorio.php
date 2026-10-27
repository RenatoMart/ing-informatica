<?php

namespace App\Persistencia\ConsultasVisitas;

use App\Persistencia\Compartido\Repositorio;

/**
 * Indicadores del tablero de inicio del panel.
 */
class DashboardRepositorio extends Repositorio
{
    /**
     * KPIs de Editor y Revisor.
     *
     * @return array<string, mixed>
     */
    public function paraEditorRevisor(int $idUsuario): array
    {
        $pendientes = array_fill_keys(['publicacion', 'docente', 'plan', 'documento', 'campana'], 0);
        foreach ($this->tabla('v_rev_pendientes')->selectRaw('entidad, count(*) AS total')->groupBy('entidad')->get() as $f) {
            $pendientes[(string) $f->entidad] = (int) $f->total;
        }

        $observados = (int) $this->tabla('publicacion')->where('id_editor', $idUsuario)->where('estado', 'borrador')->whereNotNull('observaciones_revision')->count()
            + (int) $this->tabla('docente')->where('id_editor', $idUsuario)->where('estado', 'borrador')->whereNotNull('observaciones_revision')->count()
            + (int) $this->tabla('plan_estudios')->where('id_editor', $idUsuario)->where('estado', 'borrador')->whereNotNull('observaciones_revision')->count()
            + (int) $this->tabla('documento_oficial')->where('id_editor', $idUsuario)->where('estado', 'no_publicado')->whereNotNull('observaciones_revision')->count();

        $campana = $this->tabla('campana_admision')->where('estado', 'vigente')->first(['anio', 'proceso', 'fecha_fin']);
        $plan = $this->tabla('plan_estudios')->where('estado', 'vigente')->where('es_predeterminada', true)->first(['anio', 'version']);

        return [
            'pendientes_revision' => $pendientes,
            'mis_observados' => $observados,
            'consultas' => [
                'recibidas' => (int) $this->tabla('consulta_contacto')->where('estado', 'recibida')->count(),
                'en_atencion' => (int) $this->tabla('consulta_contacto')->where('estado', 'en_atencion')->count(),
                'vencidas' => count($this->sp->filas('sp_consulta_vencidas')),
            ],
            'documentos_por_vencer_30d' => (int) $this->tabla('documento_oficial')->where('estado', 'vigente')
                ->whereRaw("fecha_vigencia BETWEEN current_date AND current_date + INTERVAL '30 days'")->count(),
            'campana_vigente' => $campana === null ? null : ['anio' => (int) $campana->anio, 'proceso' => $campana->proceso, 'fecha_fin' => $campana->fecha_fin],
            'plan_predeterminado' => $plan === null ? null : ['anio' => (int) $plan->anio, 'version' => $plan->version],
            'visitas_7d' => (int) $this->tabla('registro_visita')->whereRaw("fecha >= now() - INTERVAL '7 days'")->count(),
        ];
    }

    /**
     * KPIs del Administrador.
     *
     * @return array<string, int>
     */
    public function paraAdministrador(): array
    {
        return [
            'usuarios_activos' => (int) $this->tabla('usuario')->where('estado', 'activo')->count(),
            'usuarios_inactivos' => (int) $this->tabla('usuario')->where('estado', 'inactivo')->count(),
            'solicitudes_pendientes' => (int) $this->tabla('solicitud_acceso')->where('estado', 'pendiente')->count(),
            'solicitudes_autorizadas_sin_ejecutar' => (int) $this->tabla('solicitud_acceso')->where('estado', 'autorizada')->whereNull('fecha_ejecucion')->count(),
            'accesos_fallidos_7d' => (int) $this->tabla('bitacora_acceso')->where('accion', 'denegado')->whereRaw("fecha >= now() - INTERVAL '7 days'")->count(),
        ];
    }
}
