---
name: terminar
description: Propone qué recortar y qué pulir para dar el juego por terminado; el usuario elige cada recorte. Úsala cuando pregunte qué falta, qué recortar, cómo cerrarlo o qué sigue, o con "/terminar".
---

# Terminar

Idea tomada de `/cut` de Claude Code Game Studios (MIT), reescrita para este juego.

Terminar un juego es decidir qué NO hacer. Esta skill lee lo que existe, propone recortes con
una razón sacada de lo que hay, y deja una lista de pulido. **El usuario elige cada recorte;
no se corta nada por su cuenta.**

**Regla de oro: no se inventa nada.** Cada fila sale de un archivo, de una prueba o de algo
que el usuario dijo, y lo dice. Y **nunca se propone quitar algo que el usuario pidió
expresamente**: puede preguntarse, nunca proponerse como recorte.

## 1. Leer lo que existe

- `planes/*.md`: lo pendiente de cada plan (por ejemplo, lo que `planes/pasillo.md` dice que NO entró).
- `VERSIONES.md` y `README.md`: lo que ya está hecho.
- `playtests/*.md`, si existen: las filas "Para arreglar" sin resolver (ver `/playtest`).
- `grep -rn "TODO\|FIXME" js/ scripts/ css/` por si quedó algo anotado en el código.
- Un estado fresco: `node scripts/validar.mjs` y `node --test test/*.test.mjs` (qué pasa hoy; no se supone).
  Si hay GitHub a mano, los issues abiertos.

## 2. Una pregunta: ¿para qué se termina?

Cambia lo que vale la pena cortar. Pregúntalo una vez (AskUserQuestion), con la respuesta
anterior de `planes/terminar.md` si ya existe:

- jugarlo con unos amigos · compartirlo con un grupo (por ejemplo, una clase) · publicarlo abierto.

## 3. Proponer

**Recortes**, en este orden, cada uno con su razón:

1. Algo pendiente de un plan que ninguna sesión de juego ha echado en falta.
2. Algo que cuesta mucho mantener o probar y aporta poco al objetivo elegido.
3. Algo que ya está descartado por una decisión escrita (en un plan o en un commit).

**Pulido**: filas de lo que ya existe (fallos o confusiones de `playtests/`, TODO, pruebas que
fallan, el barrido en rojo). Cada fila termina con su fuente: `· de: <archivo o "lo dijiste tú">`.

**Para terminar de verdad, el juego debe cumplir lo que el usuario acepte como "terminado".**
Como punto de partida, que sea verificable: la campaña se juega de principio a fin en español e
inglés (el barrido en verde), las pruebas pasan, y al menos una persona la jugó en un celular real.

**Te toca a ti**: lo que solo el usuario puede hacer (borrar `zz_cabeceras` en Supabase, probar en
un celular real, ajustes de Vercel). Se listan; no se hacen.

## 4. Pantalla de decisión

```
/terminar · objetivo: <…> (dicho | supuesto)
¿Recortar? Tú eliges; no se corta nada sin tu elección.
  1. [ ] <cosa>
     · <razón, con su fuente>
Se queda: <n> cosas hechas · Pulido: <n> filas · Te toca a ti: <n>
Escribe: planes/terminar.md
```

Pregunta con AskUserQuestion, varias opciones a la vez ("Elige cuáles recortar; ninguna
también vale"). Antes de elegir no se escribe ningún archivo.

## 5. Escribir `planes/terminar.md`

Lo elegido: el objetivo; los recortes con su razón y fecha; la lista de pulido con casillas
`[ ]`; "te toca a ti". Si el archivo ya existe, se conserva lo que el usuario escribió y lo
ya tachado. No hagas commit salvo que lo pida. Quitar de verdad algo del juego es un cambio
aparte, con su versión (ver `VERSIONES.md`): dilo en una línea ("di «quita <cosa>» para sacarla").

Siguiente paso: pulir lo de la lista de a una cosa por versión, empezando por lo que más
afecta a quien juega.
