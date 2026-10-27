# Ing-Informatica · Portal de Gestión de Dirección de Escuela

Portal institucional de la **Escuela Profesional de Informática** (Facultad de Ciencias Físicas y Matemáticas, Universidad Nacional de Trujillo), con sitio público y panel de control para cargar y revisar la información.

## Tecnología

| Capa | Tecnología |
|---|---|
| Backend | Laravel 13 · PHP 8.5 · arquitectura en N-capas |
| Base de datos | PostgreSQL 18 (Neon) · funciones `sp_*` en PL/pgSQL |
| Frontend | React 18 · TypeScript · Tailwind 3 · React Router · Vite |
| Panel de control | React (misma SPA, ruta `/panel`) · TanStack Query |

## Requisitos

- PHP 8.3+ con extensiones `pdo_pgsql`, `pgsql` y `gd`
- Composer 2, Node 20+ y npm
- Una base PostgreSQL (Neon u otra)

## Puesta en marcha

```bash
composer install
npm install
cp .env.example .env
php artisan key:generate
# Edita .env: DB_URL=postgresql://USUARIO:CLAVE@HOST/neondb  (DB_SSLMODE=require)
php artisan migrate               # crea tablas, funciones y vistas
psql "$DB_URL" -f database/sql/03_datos_iniciales.sql   # datos iniciales (opcional)
php artisan storage:link
```

Desarrollo (dos terminales):

```bash
php artisan serve      # http://localhost:8000
npm run dev            # Vite con recarga en caliente
```

Producción: `npm run build` y servir con PHP-FPM / contenedor.

## Estructura

```
app/
  Dominio/<Módulo>        reglas de negocio puras
  Persistencia/<Módulo>   acceso a datos (llama a funciones sp_* de PostgreSQL)
  Aplicacion/<Módulo>     servicios con la lógica de cada proceso
  Http/                   controladores finos (Api/Panel, Api/Publico), requests, middleware
  Console/Commands/       tareas programadas (vencimientos, cierre de campañas, etc.)
routes/panel/*.php        API del panel (sesión + CSRF)
routes/publico/*.php      API pública (solo contenido publicado)
database/
  sql/                    tablas, extras, procedimientos almacenados, vistas, datos iniciales
  migrations/             ejecutan los scripts SQL
src/
  pages/ · components/    sitio público
  data/                   hooks que consumen la API (con respaldo al contenido estático)
  panel/                  panel de control (vistas, controladores, api, modelos)
  lib/ · router/          cliente HTTP y rutas
profiles/escuela/         contenido y configuración del sitio (navegación, textos, datos)
docs/DISENO_BACKEND.md    diseño completo: capas, API, panel y despliegue
tests/                    pruebas unitarias y feature (PHPUnit)
```

Módulos del backend: Usuarios, Publicaciones, Docentes, PlanEstudios, DocumentosAdmision, Revision y ConsultasVisitas.

## Roles y flujo de revisión

- **Editor** (Secretaría): crea y edita contenido; lo envía a revisión.
- **Revisor** (Director de Escuela): aprueba o rechaza; la decisión queda con fecha y usuario.
- **Administrador**: gestiona usuarios y roles.

Los registros pasan por *borrador → en revisión → publicado*. Nada se elimina: se da de baja o se archiva como histórico.

## Pruebas

Las pruebas usan un schema separado (`pruebas`) y `.env.testing`. **Nunca** ejecutes `migrate:fresh` ni `db:wipe` fuera de `APP_ENV=testing`.

```bash
php artisan test --testsuite=Unit
php artisan test --filter=PlanEstudios
npm run typecheck && npm run build
```

## Estado

Hecho: base de datos, backend por módulos, panel con todas sus pantallas y sitio público conectado a la API.
Pendiente: pruebas de punta a punta del panel, sección *Reportes*, edición de textos de páginas desde el panel, Docker y despliegue.

## Equipo

Proyecto de Competencia · Escuela Profesional de Informática, UNT.
Delgado Calle Andrea Alejandra · Martinez Aguilar Renato Alexander · Ramos Puentes Marco Antonio · Yupanqui Ramos Alex Gianmarco.
Docente: Dr. Mendoza Torres, Edwin.
