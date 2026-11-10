# Tu escuela vive en `profiles/escuela/`

Este repo es el **código compartido** (diseño, componentes, páginas). Para armar
el sitio de tu escuela **solo editas la carpeta `profiles/escuela/`**. No toques
`src/`.

```
profiles/
  escuela/     ← TU escuela: edita aquí
  _template/   ← referencia en blanco (no se publica)
```

## Qué editar en `profiles/escuela/`

| Carpeta | Qué pones |
|---|---|
| `config/site.ts` | Nombre, universidad (y `dominio` del buscador), wordmark, hero, decana, cifras, sello, enlaces |
| `config/branding.ts` | Referencias a tus logos e imágenes |
| `config/seo.ts` | Título y descripción para buscadores |
| `config/navigation.ts` | Etiquetas del menú (las rutas no se cambian) |
| `content/` | Malla, docentes, noticias, investigación, autoridades, misión/visión, home, **avisos** (banner), **admisión** (panel lateral) |
| `content/contacto.ts` | Teléfono/correo (también del navbar), dirección, redes y **mapa** (`mapaEmbedUrl`) |
| `assets/` | Tus logos e imágenes (ver `escuela/assets/` y nómbralos igual) |

> Todo el texto visible se arma desde tu perfil; no queda nada de otra escuela
> escrito dentro de `src/`. Editas `profiles/escuela/` y el sitio entero se actualiza.

## Colores de tu escuela

Los colores son **globales** y están en **`tailwind.config.js`** (raíz del repo):
azul `primary` y dorado `gold` (más `gold-ink`, el dorado oscuro para texto sobre
fondo claro). Si tu escuela quiere otros, agrega esos valores ahí.

## Probar y construir

```bash
npm install        # una vez
npm run dev        # ver en el navegador mientras editas
npm run build      # generar el sitio final (carpeta dist)
```

No necesitas configurar nada más: el sitio toma por defecto la carpeta
`profiles/escuela/`.

## Publicar (deploy)

`npm run build` deja el sitio estático en la carpeta `dist/`: publícala en tu
hosting. El servidor debe devolver `index.html` para las rutas que no existan
como archivo (SPA).

## Reglas

- **No edites `src/`** (es el código común a todas las escuelas).
- En `config/navigation.ts` puedes cambiar **etiquetas**, no las **rutas**
  (`path`): las rutas las define el router en `src/router`.
- Si te falta saber la **forma** de algún archivo de `content/`, el de
  `profiles/escuela/` ya viene lleno de ejemplo: cópialo y reemplaza los datos.

---

### Contenido desde el panel

Si el sitio está conectado al portal (`VITE_API_URL`), el contenido que se edita en el
panel **sobrescribe** el de esta carpeta al cargar la página; esta carpeta queda como
**respaldo** (se muestra si la API no responde). Para dejar un perfil listo como
respaldo basta con mantenerlo actualizado; el script `scripts/export-profile.mjs`
lo vuelca al formato del backend.

### Nota técnica (avanzado)

Internamente el perfil activo se resuelve en build-time con la variable
`PROFILE` (alias `@profile`), por defecto `escuela`. El código del sistema
importa siempre de `@/profile`, `@/navigation` y `@profile/content/*`, nunca de
una carpeta de escuela concreta. Por eso basta con editar `profiles/escuela/`.
