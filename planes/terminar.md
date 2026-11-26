# Terminar el juego

> Hecho con `/terminar` el 2026-11-13, sobre la v23, y revisado el 2026-11-26 sobre la v40.25.
> Cada fila dice de dónde sale. Los recortes y el objetivo los eligió el autor; el resto es lo que
> había en los archivos. El plan largo (mecánicas, lanzamiento, crecimiento y actualizaciones) está
> en `planes/crecimiento.md`.

## Objetivo

**Público y aulas SENA** *(dicho por el autor, 2026-11-26)*: lanzarlo abierto (web, portales,
Google Play) y llevarlo a clases con las salas. Antes era «jugarlo con unos amigos»
*(2026-11-13)*. Con el objetivo nuevo, «terminado» pide además lo de la sección 3 de
`planes/crecimiento.md` (marca, privacidad, dominio y material para mostrarlo).

## "Terminado" quiere decir

| Criterio | Hoy |
|---|---|
| La campaña se juega de principio a fin en español e inglés (barrido en verde) | ✅ Verde en `main` con la v23 (el 12 de noviembre, en el merge y en la corrida nocturna). El del último merge (las herramientas) seguía corriendo al escribir esto. |
| Las pruebas pasan | ✅ Validador y 166 pruebas en verde (2026-11-13). |
| Al menos una persona la jugó en un celular real | ❓ **Sin dato**: no existe `playtests/` y todo lo de celular se probó emulado. |
| *(nuevo, 2026-11-26)* Lo que pide salir al público: marca SENA, política de privacidad, dominio para Play, material | ❌ Pendiente · de: `planes/crecimiento.md` (sección 3) |

Estado al 2026-11-26: barrido, pruebas (358), `tsc` y regresiones en verde en `main` con la v40.25.

## Recortes elegidos (2026-11-13)

Los tres salen de `planes/pasillo.md`. Ninguno está en el juego: son cosas del plan que ya no se harán.

- [-] **Escaleras o ascensor entre etapas** · el plan lo pedía para pasar entre dos pasillos, pero se hicieron tres zonas que ya se cambian con Anterior/Siguiente y las pestañas · de: `planes/pasillo.md` ("Lo que NO entró")
- [-] **Sonido de pasos** · el plan lo marca Opcional en la fase 4 y el aprendiz ya camina con animación · de: `planes/pasillo.md` (tabla de fases)
- [-] **Mando (cruceta y A) en el pasillo** · con amigos, el toque y el teclado ya cubren el pasillo; solo el runner y el jefe leen mando · de: `planes/pasillo.md` ("Cómo se juega")

## Recortes elegidos (2026-11-26)

- [-] **Retratos en pixel** (punto D de `planes/pixel-art.md`): los 20 retratos ilustrados se quedan como están; ya se rehicieron para las escenas de cine (v39) y ninguna sesión de juego ha pedido el cambio · de: `planes/pixel-art.md` («Abierto») *(elegido por el autor)*

Nunca se ofrecieron como recorte, porque los pidió el autor: los **personajes con consejos en el
pasillo** (fase 2) y la **lista de días de respaldo**.

## Pulido

- [x] **README.md actualizado** (hecho en el PR de documentación del 2026-11-13): ya no dice "sin librerías" ni nombra `img/aprendiz.png`; lista las imágenes reales y `pixelfx.js` · de: `README.md`
- [x] **`planes/pasillo.md` al día** (2026-11-13): decisiones resueltas, recortes y personajes marcados · de: `planes/pasillo.md`
- [x] **XP al repetir un día:** decidido y hecho en la v24.1. Repetir un día ya superado paga la cuarta parte de puntos y XP; los días nuevos pagan completo · de: `js/nucleo.js` (`resultado()`) y `js/estado.js` (`facRepite`) *(decisión del autor, 2026-11-13)*
- [ ] **El XP de los días 10 y 15 no está medido**: el robot no gana al jefe ni al runner, y `/balance` los deja en "—" · de: `scripts/barrido.mjs` ("Qué NO cubre")
- [ ] **Anotar la primera sesión de juego con `/playtest`**: no hay ninguna registrada, así que no hay datos de dónde se confunde o se aburre alguien · de: `playtests/` no existe
- [ ] **Logros secretos, fase B**: 5 de los 10 (s5, s9, s1, s8, s2) tienen tarjeta y premio pero no se pueden conseguir · de: `LOGROS_SECRETOS` en `js/datos.js` y `VERSIONES.md` (v40.19)
- [ ] **El retrato del gato a 16, 32 y 48 sigue con el dibujo anterior** · de: `planes/identidad.md`
- [ ] **El barrido de `main` falló una vez por tiempo** en «versión nueva · el cartel…» (2026-11-24; pasó al repetirlo). Si se repite, dar más margen a esa espera de 8 s · de: CI de `main` (`12c4981`)
- [ ] **Puerta propia para el Bug final**: hoy es un botón "Repetir El Error Evolutivo" debajo de la escena. Funciona; es solo presentación y se puede dejar · de: `planes/pasillo.md`

## Te toca a ti

Solo el autor puede hacer esto; no se hizo ni se hará sin él.

- [ ] Borrar la función `zz_cabeceras` en el editor SQL de Supabase: `drop function if exists public.zz_cabeceras();` *(lo dijiste tú)*
- [ ] **Probar el juego en tu celular real** (el pasillo, los efectos, el runner). Es lo que falta para el tercer criterio de "terminado" · de: PR #30, #32 y #33 ("No probado: celular físico ni Safari de iPhone")
- [ ] **Desactivar el check "Vercel Preview Comments"**, que sale en rojo en todos los PR sin ser del código: Vercel → Settings → Git · de: PR #30 a #34
- [ ] Borrar de GitHub las ramas `claude/optimistic-mccarthy-06h0af` y `claude/retro-game-ui-nmbkgx`, que ya están mezcladas en `main` · de: la lista de ramas del repositorio

- [ ] **Decidir el uso de la marca SENA** fuera de las aulas: pedir aval o publicar en portales con un nombre genérico · de: `planes/crecimiento.md` (sección 3)
- [ ] **Cuenta de desarrollador de Google Play** y dominio (Vercel o propio) para `assetlinks.json`, si se publica como app · de: `planes/crecimiento.md`
- [ ] **Conseguir una ficha piloto** con un instructor para una sala en vivo: es el primer playtest real y el primer testimonio · de: `planes/crecimiento.md` (sección 4)

## Siguiente paso (2026-11-26)

Primero las mecánicas, en el orden de `planes/crecimiento.md` (sección 2): M1 (TERMINAL y ORDENA
entran en la campaña), luego `/playtest` con tres personas en celular real, y después lo demás.

## Siguiente paso (2026-11-13)

Pulir de a una cosa por versión, empezando por lo que más afecta a quien juega. Lo del XP al repetir ya está hecho (v24.1); todo lo demás es limpieza.
Y para dar el juego por terminado falta el dato del celular real.
