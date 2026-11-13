---
name: playtest
description: Anota una sesión de juego de una persona (el autor o un amigo) en un informe corto y la convierte en una lista de cosas por arreglar. Úsala cuando alguien acaba de jugar y cuenta cómo le fue, cuando el usuario pega capturas o comentarios de una partida, o con "/playtest".
---

# Playtest

Idea tomada de `/playtest-report` de Claude Code Game Studios (MIT), reescrita para este juego.

Una partida de verdad enseña lo que el barrido no ve: dónde alguien se confunde, se aburre o
deja de jugar. El barrido comprueba que el juego llegue al final; esto comprueba que **a una
persona le funcione**.

**Regla de oro: solo se escribe lo que la persona dijo o lo que se ve en lo que pegó.** Lo que
no se sabe queda como "no dicho". Nada de adivinar sentimientos ni inventar observaciones.

## 1. Preguntar (una ronda, AskUserQuestion; "no sé" siempre vale)

- ¿Quién jugó? Un apodo ("yo", "mi amigo"); no hacen falta nombres reales.
- ¿En qué aparato y navegador? (celular o computador; Chrome, Safari…)
- ¿Hasta qué día llegó y cuánto rato jugó?
- Texto libre, con sus palabras (se copian tal cual): ¿qué le gustó? ¿dónde se confundió o se
  aburrió? ¿qué falló? ¿lo volvería a jugar?

La versión del juego sale sola de `VERSION` en `js/datos.js`; no se pregunta.

## 2. Escribir `playtests/AAAA-MM-DD-apodo.md`

Con esta forma, siempre la misma, para poder comparar sesiones:

```
# Playtest · <apodo> · <fecha> · <versión>
Aparato: … · Llegó al día: … · Tiempo: …

## Lo que dijo (sus palabras)
- le gustó: …
- se confundió / se aburrió: …
- falló: …
- lo volvería a jugar: …

## Para arreglar
| # | Qué pasó | Tipo | Siguiente paso |
|---|---|---|---|
```

Cada fila de "Para arreglar" lleva un **tipo**:

- **Fallo**: algo se rompió. Siguiente paso: reproducirlo (`node scripts/regresiones.mjs`,
  `node scripts/barrido.mjs --dias N`); si se reproduce, escribir primero la prueba que falla.
- **Confusión**: el juego no se explica (un texto, un botón, una regla). Paso: qué texto o pantalla cambiar.
- **Balance**: demasiado fácil, difícil, caro o lento. Paso: `/balance`.
- **Idea**: algo que se le ocurrió. Paso: anotarla en el plan que corresponda (`planes/`); no se hace.

Si la sesión no dejó nada para arreglar, la tabla dice "nada" y ya.

## 3. Cerrar

Di en una línea qué se escribió y cuántas filas hay por tipo. No hagas commit ni cambies el
juego: el informe es un registro, y arreglar es otra decisión del usuario. Si piden arreglar
algo, se hace como cualquier cambio (ver `VERSIONES.md`), y la fila se marca como hecha con la versión.
