# AGENTS.md · Aprendiz en apuros

Contexto y reglas para cualquier IA o persona que trabaje en este repositorio (Claude, Codex,
Gemini, Cursor, Copilot…). Si usas una IA en el navegador, pega este archivo al empezar.
El detalle está en `README.md`; los planes, en `planes/`; la historia de versiones, en `VERSIONES.md`.

## Qué es

Juego retro de 32 bits (pixel art + CRT) sobre la formación de un aprendiz de programación del
**SENA** (Colombia): 15 días en dos etapas, la **lectiva** (días 1-10, centro de formación) y la
**productiva** (días 11-15, empresa), hasta el título de Técnico en Programación de Software.
Minijuegos de programación, jefe final evolutivo, pasillo con personajes, tienda, logros, reto
diario, marcador global (Supabase), salas de clase en vivo y PWA sin conexión. ES/EN.
Se juega en https://antoniyesidpabonpenalosa-bit.github.io/aprendiz-en-apuros/

**Hacia dónde va** (decisiones del autor, `planes/crecimiento.md`): lanzarlo al público y a
aulas SENA; **primero mejorar las mecánicas**, el mundo abierto queda para después.

## Reglas que no se rompen

1. **HTML, CSS y JavaScript puro.** Sin frameworks, sin dependencias en tiempo de ejecución, sin
   paso de compilación para jugar. `index.html` debe funcionar con doble clic.
2. **Scripts clásicos, no módulos.** Los 41 `js/*.js` se cargan en orden con `<script>` y
   comparten un espacio de nombres global. No uses `import`/`export` en `js/`. Un nombre global
   repetido entre archivos rompe el juego (lo vigila `scripts/validar.mjs`).
3. **Todo texto visible en los dos idiomas.** Los textos van en `TXT.es` / `TXT.en`
   (`js/datos.js`) y se leen con `t('clave')`. Los bancos de contenido traen `es`/`en`.
4. **La partida guardada es sagrada.** El estado es `S` (`js/estado.js`): campos nuevos en `DEF`,
   en el `@typedef Partida` y en `sanear()`, que debe aceptar partidas y códigos viejos sin romper
   nada. Se guarda con `guardar()`.
5. **Cada versión sube su número y la caché.** En `js/datos.js`, `VERSION` y una entrada nueva **al
   principio** de `NOVEDADES` (ES y EN). En `sw.js`, `CACHE = 'pa4-' + VERSION`. El número grande
   sube con lo nuevo (`v40.25` → `v41`) y el pequeño con los arreglos (`v40.25` → `v40.26`). Añade
   también una fila en `VERSIONES.md`. Un archivo nuevo que el juego necesite va en `BASE` de
   `sw.js`.
6. **Cada fallo arreglado deja su prueba:** un caso en `scripts/regresiones.mjs` (navegador) o en
   `test/*.test.mjs` (lógica), que nombre el fallo que vigila.
7. **No se cambian números del juego a ojo** (XP, puntos, precios, vidas, tiempos): se miden antes
   con el barrido (`/balance` en Claude Code).
8. **Accesibilidad:** respeta `prefers-reduced-motion`, el modo de texto legible (`S.legible`) y la
   lista de días como alternativa al pasillo.
9. **Una rama por cambio.** Nada se une a `main` sin que pasen las comprobaciones de abajo.

## Comprobaciones (las mismas que corre la integración continua)

```bash
node scripts/validar.mjs                              # sintaxis, referencias, HTML, caché, globales
node --test test/*.test.mjs                           # pruebas de lógica (node:test, sin dependencias)
npx --yes -p typescript@6.0.2 tsc -p jsconfig.json    # tipos JSDoc (lee la salida COMPLETA)
node scripts/build-ui-kit.mjs --check                 # el UI kit al día con el CSS
node scripts/regresiones.mjs                          # casos en navegador (Playwright), ~1-5 min
node scripts/barrido.mjs --dif 0 --lang es            # los 15 días en PRÁCTICA, ~2 min
```

Node 20 o superior. Para verlo en local: `python3 -m http.server 8080` y abrir `http://localhost:8080`.

## Mapa rápido

| Dónde | Qué |
|---|---|
| `js/datos.js` | `NIVELES` (los 15 días), bancos (`QUIZ`, `SQLS`, `REGEXS`, `TERMINALES`, `PASOS`, `CODIGO`, `CONFLICTOS`…), `DIALOGOS`, `LOGROS`, `TXT`, `VERSION`, `NOVEDADES` |
| `js/estado.js` | partida `S`, `DEF`, `sanear()`, `guardar()`, `aplicarModo()` |
| `js/nucleo.js` · `js/menus.js` | router de pantallas, resultado y fallo, portada, flujo del día |
| `js/minijuegos*.js` | los 12 minijuegos; `js/jefe*.js`, el jefe final |
| `js/pasillo.js` · `js/consejos.js` | el mapa de la campaña y lo que dicen los personajes |
| `js/reto*.js` · `js/sala*.js` · `js/ranking.js` | reto diario, salas de clase, marcador (Supabase vía `fetch`) |
| `css/estilos.css` | todos los estilos (el UI kit de `design-system/` sale de aquí) |
| `img/` · `arte/` · `scripts/build-*` | imágenes publicadas · fuentes de arte · generadores |
| `db/*.sql` | esquema y reglas de Supabase (aplicados a mano por el autor) |

## Cómo entregar un cambio

- **Explica en español sencillo** qué cambia para quien juega y qué no cambia.
- **Si cambia algo que se ve**, enseña capturas: escritorio y móvil, ES y EN, normal y legible.
- **No reemplaces a ciegas** archivos que hayan cambiado después de tu copia: integra encima de lo
  que hay.
- **No pongas claves, tokens ni datos personales** en el código ni en los commits.

Recetas para pedir arte, textos y preguntas a otras IAs: `planes/recetas-ia.md`.
