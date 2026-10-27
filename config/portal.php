<?php

/**
 * Parámetros de negocio del Portal de Gestión de Dirección de Escuela (docs/DISENO_BACKEND.md).
 * Lo que depende del entorno se lee del `.env`; el resto son reglas fijas del diseño.
 */
return [

    /** Zona horaria de negocio (también en config/app.php y en la conexión pgsql). */
    'zona_horaria' => 'America/Lima',

    /** Dominio obligatorio de los correos institucionales del panel (pregunta abierta 2). */
    'dominio_correo' => env('PORTAL_DOMINIO_CORREO', 'unitru.edu.pe'),

    /** Vigencia del enlace de recuperación de contraseña, en minutos. */
    'minutos_token' => 60,

    /** Días de anticipación del aviso de vencimiento de documentos (portal:avisar-vencimientos). */
    'dias_aviso_vencimiento' => 15,

    /** Plazos de atención de consultas en días hábiles (lunes a viernes): clasificar y responder. */
    'plazo_clasificacion_dh' => 2,
    'plazo_respuesta_dh' => 5,

    'correo_comision_admision' => env('PORTAL_CORREO_COMISION'),
    'correo_remitente_consultas' => env('MAIL_FROM_ADDRESS'),

    /** URL base del panel, para enlaces en correos. */
    'url_panel' => rtrim((string) env('APP_URL', 'http://localhost'), '/').'/panel',

    /** Imágenes subidas (sección 5.4). Tamaños en KB. */
    'imagenes' => [
        'mimes' => ['image/jpeg', 'image/png', 'image/webp'],
        'max_kb' => 5120,
        'calidad_webp' => 82,
        'publicacion' => [
            'ancho' => 600,
            'alto' => 400,
            'max_por_publicacion' => 6,
        ],
        'docente' => [
            'lado_maximo' => 900,
            'min_ancho' => 300,
            'min_alto' => 300,
            'encuadre_x_defecto' => 50,
            'encuadre_y_defecto' => 25,
        ],
    ],

    /** PDF de planes y documentos oficiales. */
    'pdf' => [
        'max_kb' => 10240,
    ],

    /** Verificación de enlaces externos de la campaña de admisión. */
    'enlaces' => [
        'timeout_segundos' => 5,
    ],

    'paginacion' => [
        'por_pagina' => 20,
        'maximo' => 100,
    ],

    /** Límites de peticiones (RateLimiter). */
    'limites' => [
        'login_por_minuto' => 5,
        'recuperar_por_hora' => 3,
        'publico_por_minuto' => 120,
        'consultas_por_hora' => 5,
        'visitas_por_minuto' => 60,
    ],

    'plan' => [
        'max_cursos_importacion' => 120,
    ],

    'estadisticas' => [
        'max_dias_rango' => 366,
    ],

    'busqueda' => [
        'min_caracteres' => 3,
        'max_resultados' => 20,
    ],

];
