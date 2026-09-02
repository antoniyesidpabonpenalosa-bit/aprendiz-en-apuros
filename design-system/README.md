# UI Kit · Practicante en Apuros 4

Sistema de diseño extraído directamente del juego: los mismos tokens de
color, tipografías y componentes que ves en pantalla, catalogados y listos
para sincronizarse con un proyecto de design system en
[claude.ai/design](https://claude.ai/design).

**Ver la galería:** abre `dist/index.html` en el navegador, o sirve la
carpeta con `python3 -m http.server 8080` desde la raíz del repo y entra a
`http://localhost:8080/design-system/dist/`.

## Por qué existe

El juego no usa ningún framework de componentes — todo el estilo vive en
`css/estilos.css`. Este kit no es una reescritura paralela: es una
*catalogación* de ese mismo CSS, generada por script para que nunca se
desincronice del juego real.

## Estructura

```
design-system/
├── src/                    → fuente de verdad de cada fragmento (HTML del <body>)
│   ├── foundations/         tipografía (la paleta se genera, no tiene fuente propia)
│   ├── components/          botones, HUD, mapa, minijuegos, tienda, feedback...
│   └── temas/                comparativa RETRO vs OLED
└── dist/                   → generado, NO editar a mano
    ├── base.css              css/estilos.css real + un armónico de previsualización
    ├── foundations/*.html    una tarjeta por archivo, con marcador @dsCard
    ├── components/*.html
    ├── temas/*.html
    └── index.html            galería de una sola página con las 18 tarjetas
```

`scripts/build-ui-kit.mjs` (en la raíz del repo) hace la generación:

1. Lee `css/estilos.css` **en vivo** — nunca copia ni duplica el CSS a mano.
2. Extrae la paleta de colores automáticamente de las variables `:root`
   (agrupada por prefijo: `g*` verde, `y*` amarillo, `v*` violeta, etc.).
   Si el juego suma o cambia un token, la página de colores se actualiza sola.
3. Ensambla cada fragmento de `src/` con `base.css` en un documento completo,
   con el marcador `<!-- @dsCard group="…" title="…" -->` que usa el panel
   de Design System de claude.ai para armar las tarjetas.
4. Genera `dist/index.html`: una galería local que embebe las mismas 18
   tarjetas para revisarlas sin depender de claude.ai/design.

## Regenerar

Cada vez que cambies algo en `design-system/src/` o en `css/estilos.css`:

```bash
node scripts/build-ui-kit.mjs
```

Para comprobar que `dist/` sigue sincronizado con las fuentes (sin
escribir nada — regenera en una carpeta temporal y compara):

```bash
node scripts/build-ui-kit.mjs --check
```

Este segundo comando corre en CI (`.github/workflows/validar.yml`), así
que un `dist/` desactualizado hace fallar el build.

## Añadir un componente nuevo

1. Crea el fragmento en `design-system/src/components/<nombre>.html`
   (solo el contenido del `<body>`, con las clases reales del juego).
2. Agrégalo al arreglo `TARJETAS` en `scripts/build-ui-kit.mjs`.
3. Corre `node scripts/build-ui-kit.mjs`.
4. Corre `node scripts/validar.mjs` para confirmar que quedó bien anidado.

**Convención de `id` en los fragmentos:** `dist/index.html` concatena todos
los fragmentos en una sola página, así que dos fragmentos que usen el mismo
`id` producen HTML inválido. Por eso los fragmentos se estilizan **por
clase**, no por `id` — si el CSS del juego engancha algo por `id` (como hacía
`#b-lang`), conviene pasarlo a clase en `css/estilos.css` y dejar el `id`
solo en `index.html`, donde lo necesita el JS. `validar.mjs` falla si se
cuela un `id` repetido.

## Sincronizar con claude.ai/design

La sincronización real (crear el proyecto y subir las tarjetas) usa la
herramienta `DesignSync`/`/design-sync`, que requiere autorización de
diseño vía `/design-login`. Ese comando necesita una terminal interactiva,
así que **no funciona en Claude Code en la web** — hay que ejecutarlo desde
Claude Code de escritorio o la CLI:

1. Abre este repo con Claude Code de escritorio o la CLI.
2. Corre `/design-login` y autoriza el acceso.
3. Pide sincronizar `design-system/dist/` con un proyecto de design system
   (nuevo o existente) — `DesignSync` sube cada archivo con su marcador
   `@dsCard` y arma las tarjetas automáticamente.

Mientras tanto, `dist/index.html` es la forma de revisar el kit completo
sin esa integración.
