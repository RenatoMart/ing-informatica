<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/png" href="/favicon-ingamb.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Programa de Estudios</title>
    <meta name="description" content="Sitio institucional del Programa de Estudios. El título y la descripción definitivos se toman del perfil (config/seo.ts) al cargar la página." />
    <!-- Fuentes Institucionales -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Roboto+Slab:wght@400;500;700;900&display=swap" rel="stylesheet">
    @viteReactRefresh
    @vite('src/main.tsx')
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
