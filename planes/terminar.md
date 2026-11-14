# Terminar el juego

> Hecho con `/terminar` el 2026-11-13, sobre la v23. Cada fila dice de dónde sale.
> Los recortes y el objetivo los eligió el autor; el resto es lo que había en los archivos.

## Objetivo

**Jugarlo con unos amigos** *(dicho por el autor, 2026-11-13)*. Importa que se juegue bien
de principio a fin; el resto es opcional.

## "Terminado" quiere decir

| Criterio | Hoy |
|---|---|
| La campaña se juega de principio a fin en español e inglés (barrido en verde) | ✅ Verde en `main` con la v23 (el 12 de noviembre, en el merge y en la corrida nocturna). El del último merge (las herramientas) seguía corriendo al escribir esto. |
| Las pruebas pasan | ✅ Validador y 166 pruebas en verde (2026-11-13). |
| Al menos una persona la jugó en un celular real | ❓ **Sin dato**: no existe `playtests/` y todo lo de celular se probó emulado. |

## Recortes elegidos (2026-11-13)

Los tres salen de `planes/pasillo.md`. Ninguno está en el juego: son cosas del plan que ya no se harán.

- [-] **Escaleras o ascensor entre etapas** · el plan lo pedía para pasar entre dos pasillos, pero se hicieron tres zonas que ya se cambian con Anterior/Siguiente y las pestañas · de: `planes/pasillo.md` ("Lo que NO entró")
- [-] **Sonido de pasos** · el plan lo marca Opcional en la fase 4 y el aprendiz ya camina con animación · de: `planes/pasillo.md` (tabla de fases)
- [-] **Mando (cruceta y A) en el pasillo** · con amigos, el toque y el teclado ya cubren el pasillo; solo el runner y el jefe leen mando · de: `planes/pasillo.md` ("Cómo se juega")

Nunca se ofrecieron como recorte, porque los pidió el autor: los **personajes con consejos en el
pasillo** (fase 2) y la **lista de días de respaldo**.

## Pulido

- [x] **README.md actualizado** (hecho en el PR de documentación del 2026-11-13): ya no dice "sin librerías" ni nombra `img/aprendiz.png`; lista las imágenes reales y `pixelfx.js` · de: `README.md`
- [x] **`planes/pasillo.md` al día** (2026-11-13): decisiones resueltas, recortes y personajes marcados · de: `planes/pasillo.md`
- [x] **XP al repetir un día:** decidido y hecho en la v24.1. Repetir un día ya superado paga la cuarta parte de puntos y XP; los días nuevos pagan completo · de: `js/nucleo.js` (`resultado()`) y `js/estado.js` (`facRepite`) *(decisión del autor, 2026-11-13)*
- [ ] **El XP de los días 10 y 15 no está medido**: el robot no gana al jefe ni al runner, y `/balance` los deja en "—" · de: `scripts/barrido.mjs` ("Qué NO cubre")
- [ ] **Anotar la primera sesión de juego con `/playtest`**: no hay ninguna registrada, así que no hay datos de dónde se confunde o se aburre alguien · de: `playtests/` no existe
- [ ] **Puerta propia para el Bug final**: hoy es un botón "Repetir El Error Evolutivo" debajo de la escena. Funciona; es solo presentación y se puede dejar · de: `planes/pasillo.md`

## Te toca a ti

Solo el autor puede hacer esto; no se hizo ni se hará sin él.

- [ ] Borrar la función `zz_cabeceras` en el editor SQL de Supabase: `drop function if exists public.zz_cabeceras();` *(lo dijiste tú)*
- [ ] **Probar el juego en tu celular real** (el pasillo, los efectos, el runner). Es lo que falta para el tercer criterio de "terminado" · de: PR #30, #32 y #33 ("No probado: celular físico ni Safari de iPhone")
- [ ] **Desactivar el check "Vercel Preview Comments"**, que sale en rojo en todos los PR sin ser del código: Vercel → Settings → Git · de: PR #30 a #34
- [ ] Borrar de GitHub las ramas `claude/optimistic-mccarthy-06h0af` y `claude/retro-game-ui-nmbkgx`, que ya están mezcladas en `main` · de: la lista de ramas del repositorio

## Siguiente paso

Pulir de a una cosa por versión, empezando por lo que más afecta a quien juega. Lo del XP al repetir ya está hecho (v24.1); todo lo demás es limpieza.
Y para dar el juego por terminado falta el dato del celular real.
