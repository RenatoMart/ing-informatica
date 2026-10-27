<?php

namespace App\Dominio\Usuarios;

/**
 * Permisos de la matriz 3.3 (docs/DISENO_BACKEND.md). Los asigna {@see Rol::permisos()}.
 */
enum Permiso: string
{
    case GestionarSesionPropia = 'gestionar_sesion_propia';
    case VerDashboard = 'ver_dashboard';
    case EditarContenido = 'editar_contenido';
    case GestionarDepartamentos = 'gestionar_departamentos';
    case DecidirRevision = 'decidir_revision';
    case EstablecerPlanPredeterminado = 'establecer_plan_predeterminado';
    case AtenderConsultas = 'atender_consultas';
    case VerEstadisticas = 'ver_estadisticas';
    case RegistrarSolicitudes = 'registrar_solicitudes';
    case ResolverSolicitudes = 'resolver_solicitudes';
    case EjecutarSolicitudes = 'ejecutar_solicitudes';
    case EditarUsuarios = 'editar_usuarios';
    case VerUsuarios = 'ver_usuarios';
    case VerBitacora = 'ver_bitacora';
}
