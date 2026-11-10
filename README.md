# Sitio institucional de Programa de Estudios (plantilla multi‑escuela)

Sitio web institucional para un **Programa de Estudios** universitario, construido
como **plantilla reutilizable**: el diseño y el código son compartidos, y los datos
de cada escuela viven en un *perfil* aparte. Así, cada persona del equipo clona el
repo, edita **solo el perfil de su escuela** y publica, sin tocar `src/`.

> ¿Vas a editar el contenido de tu escuela? Ve directo a
> **[`profiles/README.md`](profiles/README.md)**.

## Stack

- **React 18** + **TypeScript** + **Vite 5**
- **TailwindCSS 3** (colores de marca globales en `tailwind.config.js`)
- **React Router 6** (rutas), **Framer Motion** (animación)
- **ReactFlow** + **dagre** (malla curricular y organigrama como grafos)
- **lucide-react** (iconografía)

## Arranque rápido

Requisitos: **Node 18+** y npm.

```bash
npm install     # una vez
npm run dev     # desarrollo en el navegador (http://localhost:5173)
npm run build   # genera el sitio final
```

| Script | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo con recarga en caliente |
| `npm run build` | Compila el sitio a la carpeta de salida (ver *Despliegue*) |
| `npm run preview` | Sirve localmente el build de producción |
| `npm run typecheck` | Verifica tipos con TypeScript (`tsc --noEmit`) |
| `npm run lint` | Linter sobre `src/` |

## Arquitectura: sistema vs. perfil

El proyecto separa el **código común** del **contenido de cada escuela**:

```
src/                  Sistema: páginas, componentes, router, estilos (NO se edita por escuela)
profiles/
  escuela/            Perfil activo por defecto: los datos de TU escuela
    config/           Identidad (site), branding, SEO, navegación
    content/          Malla, docentes, noticias, autoridades, admisión, avisos, ...
    assets/           Logos e imágenes
    index.ts          Compone el perfil
  _template/          Perfil en blanco de referencia (no se publica)
profiles/README.md    Guía para editar tu escuela
tailwind.config.js    Colores de marca (globales a todas las escuelas)
vite.config.ts        Build, alias y selección de perfil
```

El sistema **nunca** importa de una carpeta de escuela concreta: usa los alias
`@/` (→ `src/`) y `@profile` (→ el perfil activo). Todo el texto visible se arma
desde el perfil; no queda nada de una escuela escrito dentro de `src/`.

### El perfil activo

Se resuelve en **build‑time** con la variable de entorno `PROFILE`
(por defecto `escuela`), vía el alias `@profile` en `vite.config.ts`:

```bash
npm run build                 # usa profiles/escuela
PROFILE=otra-escuela npm run build   # usa profiles/otra-escuela
```

### Crear una escuela nueva

1. Copia `profiles/_template/` (o `profiles/escuela/`) a `profiles/<tu-escuela>/`.
2. Rellena `config/` y `content/`, y coloca tus imágenes en `assets/`.
3. Construye con `PROFILE=<tu-escuela> npm run build`.

El modelo habitual del equipo es más simple: cada quien edita directamente
**`profiles/escuela/`** en su clon. Ver [`profiles/README.md`](profiles/README.md).

## Colores de marca

Son **globales** (iguales para todas las escuelas) y están en
**`tailwind.config.js`**: `primary` (azul) y `gold` (dorado), entre otros tokens.
Para **texto** dorado sobre fondos claros usa `gold-ink` (dorado oscuro que sí
cumple contraste AA); reserva `gold` para el logotipo, íconos, rellenos y bordes.
Si una escuela necesita otra paleta, se ajustan ahí.

## Despliegue

`npm run build` genera el sitio estático en `dist/` (con `base` `/`). Publica esa
carpeta en cualquier hosting de archivos estáticos; debe devolver `index.html` para
las rutas que no existan como archivo (SPA). `vercel.json` ya trae esa regla para
quien use Vercel.

## Convenciones

- **No edites `src/`** para cambiar contenido: todo dato de escuela va en su perfil.
- En `config/navigation.ts` puedes cambiar **etiquetas** del menú, no las **rutas**
  (las define el router en `src/router`).
- Mantén `npm run typecheck` y `npm run lint` en verde antes de publicar.
