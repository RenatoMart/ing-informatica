<?php

/*
 * Rutas del sitio público: /api/publico/... con el grupo `api` (sin estado ni CSRF) y `throttle:publico`.
 * Ver bootstrap/app.php.
 *
 * Cada módulo declara sus rutas en routes/publico/<modulo>.php (sin prefijo; ya se aplica api/publico).
 */

$archivos = glob(__DIR__.'/publico/*.php') ?: [];
sort($archivos);

foreach ($archivos as $archivo) {
    require $archivo;
}
