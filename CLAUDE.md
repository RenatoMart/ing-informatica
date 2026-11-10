# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Institutional site for a university "Programa de Estudios" (Escuela Profesional de Informática), built as a **reusable multi-school template**: shared React code in `src/`, per-school data in a `profiles/` folder. Team members clone the repo and edit only their school's profile without touching `src/`. All Spanish-language content (data, comments, docs) — keep that convention when adding files.

## Commands

```bash
npm install         # once
npm run dev          # dev server, http://localhost:5173
npm run build        # production build (destination depends on env vars, see Deploy)
npm run preview      # serve the production build locally
npm run typecheck    # tsc --noEmit
npm run lint         # eslint src (warn-only config, does not fail the build)
```

There is no test suite in this repo (no test runner configured).

Build with a specific school profile:

```bash
PROFILE=<slug> npm run build          # use profiles/<slug> instead of profiles/escuela
```

## Architecture: system vs. profile

The defining architectural rule of this repo: **`src/` is shared code and is never edited per school; all school-specific data lives in `profiles/<slug>/`.**

```
src/                    System: pages, components, router, styles — school-agnostic
profiles/
  escuela/               Active default profile — this school's real data
    config/              site.ts, branding.ts, seo.ts, navigation.ts
    content/              malla.ts, docentes.ts, noticias.ts, autoridades.ts, home.ts, admision.ts, avisos.ts, contacto.ts, ...
    assets/               logos/images referenced by branding.ts
    index.ts              composes the profile object (implements `Profile` from src/profile-types.ts)
  _template/              blank reference profile (not published, not a real deploy target)
tailwind.config.js        Brand colors — global across all schools (primary/gold/ink/...)
vite.config.ts            Resolves the active profile + deploy output at build time
```

- The active profile is resolved **at build time** via the `PROFILE` env var (default `escuela`), through the `@profile` alias defined in both `vite.config.ts` and `tsconfig.json` (`paths` there is hardcoded to `profiles/escuela` for the editor/typechecker — only the Vite alias is dynamic).
- System code must **never** import from a concrete `profiles/<slug>/...` path. It always imports through:
  - `@/profile` (`src/profile.ts`) → re-exports `site`, `branding`, `seo`, and the derived `siteName`
  - `@/navigation` (`src/navigation.ts`) → re-exports `NAV_LINKS`/`ADMISION_GROUPS` from the profile plus traversal helpers (`getSection`, `getInternalItems`, `expandNavLinks`)
  - `@profile/content/*` directly, for page-level content modules (malla, docentes, noticias, etc.)
- The shape every profile must satisfy is the `Profile` interface in `src/profile-types.ts` (`SiteConfig`, `BrandingConfig`, `SeoConfig`, plus the nav types `NavSection`/`NavGroup`/`NavLeaf`). Read this file before adding/changing profile fields — it's the contract.
- Brand theme (colors, fonts) is **not** part of the profile — it's global, in `tailwind.config.js` (`primary`, `gold`, `gold-deep`, `gold-ink`/`ink`, etc.), shared by every school.
- `config/navigation.ts` in a profile can rename menu **labels** but not **routes** (`path`) — routes are defined once in `src/router/index.tsx` and must stay in sync with what each profile's nav data points to.

### Adding a new school

Copy `profiles/_template/` (or `profiles/escuela/`) to `profiles/<slug>/`, fill in `config/` and `content/`, drop images into `assets/`, then build with `PROFILE=<slug> npm run build`. No `src/` changes required.

## Routing & pages

- Router is centralized in `src/router/index.tsx`. Only `Inicio` (home) is eagerly imported; every other page is `lazy()`-loaded for code-splitting, wrapped in a shared `Suspense` fallback.
- Section pages (Nosotros, Organización, Académico, Investigación) use nested routes: a parent route renders a section shell (`SectionLayout`, in `src/components/layout/SectionLayout.tsx`) with `<Outlet/>`, and child routes render each tab's content. `SectionLayout` derives its tab list from `@/navigation` (`getSection`/`getInternalItems`) — so a page won't show as a tab unless it's also wired into the profile's `config/navigation.ts`.
- Some page files live under `src/pages/nosotros/` or `src/pages/autoridades/` but are mounted under a different route (e.g. `/academico`, `/organizacion`) per historical reorganization — check `src/router/index.tsx` for the actual mount point rather than assuming from file location.

## Notable UI patterns

- `MallaCurricular`/`MallaFlow` (curriculum mesh) and `OrganigramaFlow` (org chart) render their data as graphs using **ReactFlow** + **dagre** for auto-layout, sourced from `@profile/content/malla.ts` / `autoridades.ts`.
- Path aliases: `@/*` → `src/*`, `@profile`/`@profile/*` → the active profile (see above). Always use these instead of relative `../../` chains across the system/profile boundary.

## Content from the portal API (`src/data/`)

- At startup `src/main.tsx` calls `iniciarPerfilRemoto` (`src/data/perfilRemoto.ts`): it fetches `GET {VITE_API_URL}/api/v1/public/escuelas/{VITE_ESCUELA_SLUG}/perfil` (waits up to 1.5 s) and `src/data/hidratar.ts` overwrites **in place** the objects/arrays that `profiles/<slug>/` exports (the same ones the pages already import). The static `profiles/` files are therefore the **fallback**: if the API is down the site still renders with them. Do not add module-level constants derived from profile data — read them at render time, or they will go stale after hydration.
- The 7 exported strings that cannot be mutated (`mision`, `vision`, `misionUnt`, `visionUnt`, `gradoAcademico`, `tituloProfesional`, `libroReclamacionesUrl`) are `let` with an `__aplicar()` function in their profile file; `siteName` in `src/profile.ts` is a live binding refreshed by `actualizarSiteName()`.
- To make a new profile export editable from the panel: add it to `aplicarClave` in `src/data/hidratar.ts` and to the matching JSON Schema in the backend repo (`portal-unt-back/internal/content/schemas/`). Icons in `home.accesosRapidos` are names from the allow-list in `src/data/iconos.ts` (must match the backend schema `enum`).
- **Live preview:** the panel embeds the site in an iframe with `?preview=1`. Only in that mode (and only inside an iframe) the site listens for `postMessage` from origins in `VITE_PANEL_ORIGINS` (`borrador`, `recargar`, `ir`) and re-mounts the app keeping the scroll; `CurriculumVersionSwitch` opens on the first version (real data) instead of "2027".
- Env vars: see `.env.example` (`VITE_API_URL`, `VITE_ESCUELA_SLUG`, `VITE_PANEL_ORIGINS`). The hosting must allow being framed by the panel (no `X-Frame-Options: DENY`).
- Not wired yet: `comites` and `paginas` (stored by the backend, still hard-coded in `Comites.tsx` / the router).

## Deploy (`vite.config.ts`)

- `npm run build` outputs a static SPA to `dist/` with base `/`; nothing is written outside the project. Any static host works if it serves `index.html` for unknown routes (`vercel.json` has that rewrite).

## Linting

ESLint (`eslint.config.js`) is intentionally warn-only (react-hooks rules, jsx-a11y, unused vars ignoring `_`-prefixed names) — it will not fail a build. Type safety is enforced separately via `npm run typecheck`; keep both green before publishing per the README's stated convention.

## Seguridad (backend/panel)
Las reglas de seguridad AppSec/OWASP (cookies HttpOnly, sin tokens en el frontend, anti-IDOR, DTOs estrictos, bcrypt ≥12, timeouts, CORS estricto) están en `/home/renatomr/GolandProjects/portal-unt-back/CLAUDE.md`: seguirlas siempre que se toque el backend o el panel, y no poner secretos ni lógica de permisos en este sitio.

## Convención de commits
Se usa **Conventional Commits**, en español y a nombre único del autor (sin líneas `Co-Authored-By`).

- Formato: `tipo(ámbito): resumen` — en imperativo, minúscula inicial, sin punto final, máximo ~72 caracteres.
- Tipos: `feat` (función nueva), `fix` (corrección), `perf` (rendimiento), `refactor`, `style` (formato), `docs`, `test`, `build` (Docker, dependencias, compilados), `ci` (GitHub Actions), `chore` (mantenimiento).
- Ámbito: el módulo tocado (`contacto`, `perfil`, `panel`, `auth`, `noticias`, `railway`…).
- **Un commit = un cambio lógico.** No mezclar una función nueva con formato o documentación ajena.
- Cada commit debe compilar y pasar las comprobaciones del proyecto.
- El cuerpo (opcional, tras una línea en blanco) explica el **porqué**, no el cómo.
- Cambios incompatibles: `tipo(ámbito)!: …` y una línea `BREAKING CHANGE: …` en el cuerpo.
- No reescribir el historial ya subido (`push --force`) salvo acuerdo expreso.

Ejemplos: `feat(contacto): validar las transiciones de estado`, `fix(auth): renovar la sesión al cambiar la clave`, `docs: guía de despliegue en Railway`.
