<?php

/*
 * Rutas del panel: /api/panel/... con el grupo `web` (sesión + CSRF). Ver bootstrap/app.php.
 *
 * Cada módulo declara sus rutas en routes/panel/<modulo>.php (sin prefijo; ya se aplica api/panel).
 * Las rutas autenticadas usan el grupo `['auth', 'activo', 'cambio_contrasena']` y, si aplica, `rol:Editor,Revisor`.
 */

$archivos = glob(__DIR__.'/panel/*.php') ?: [];
sort($archivos);

foreach ($archivos as $archivo) {
    require $archivo;
}
