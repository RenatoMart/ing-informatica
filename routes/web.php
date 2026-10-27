<?php

use Illuminate\Support\Facades\Route;

/*
 * SPA: React Router resuelve el sitio público y el panel (/panel/*).
 * El comodín excluye la API (api/panel, api/publico), el health check (/up), los archivos subidos
 * (/storage, para que un archivo inexistente dé 404 y no la SPA) y los assets de Vite (/build).
 */
Route::view('/{any?}', 'app')->where('any', '^(?!(api|up|storage|build)(/|$)).*$');
