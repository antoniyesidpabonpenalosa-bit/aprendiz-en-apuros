---
name: balance
description: Revisa si los números del juego (XP, rangos, puntos, precios de la tienda, vidas, dificultades) están equilibrados, MIDIÉNDOLOS con el robot del barrido en vez de adivinar. Úsala cuando algo se sienta mal (un rango que llega muy pronto, algo muy caro o muy fácil), antes de cambiar cualquier cifra, o con "/balance". Propone cambios; no cambia nada sin que el usuario elija.
---

# Balance

Idea tomada de `/balance-check` de Claude Code Game Studios (MIT), reescrita para este juego.

**Regla de oro: un número que no se midió no se inventa.** Si falta un dato, esa parte
dice "no medido" y se dice por qué. Nunca se rellena con una estimación sin marcarla como
estimación. (Así se encontró el fallo de los rangos de la v21.5: el máximo estaba en 4.500
XP y un día ya daba 600–2.400; nadie lo había medido.)

## 1. Leer las cifras

En `js/datos.js` (usa Grep, no leas el archivo entero: pesa ~90 KB):

- `RANGOS`: los umbrales de XP de cada rango.
- `DIFS` y las funciones `facPts`, `facTiempo`, `facJefe`, `maxVidas` (`js/estado.js`): lo que cambia cada dificultad.
- Los precios de la tienda: `ACCS`, `SKINS`, `CAMISAS` y las mejoras (`mejora(`).
- Cuánto suma un día: `resultado()` en `js/nucleo.js` (`S.pts += gan; S.xp += gan`).

## 2. Medir

```
node scripts/barrido.mjs --dias 1-15 --dif 1 --lang es --informe <scratchpad>/balance.md
```

Es NORMAL y español: unos 5 minutos. Para comparar dificultades, `--dif 0,1,2` (unos 15).
Escribe el informe fuera del repositorio (el scratchpad), no en la raíz. Lee la sección
**"Cuánto da cada día"**: XP por día y acumulado.

Lo que el robot **no** mide: el jefe (días 10 y 15) y el runner salen "—". Para esos días
da una estimación, ESCRITA como estimación ("≈2.300, supuesta igual a los vecinos"). El robot
es rápido y los puntos llevan bonus de tiempo: un jugador real saca algo menos.

## 3. Comparar

1. **Rangos contra la historia.** Cada rango debe caer donde dice la historia: APRENDIZ tras el
   día 1, PRACTICANTE hacia el día 5, DEV JUNIOR al terminar la etapa lectiva (día 10),
   TITULADO SENA al acabar la campaña (día 15) y DEV SENIOR solo si se sigue jugando después.
2. **Saltos.** Un día que da el doble o la mitad que sus vecinos, sin razón de diseño.
3. **Farmeo.** `resultado()` suma XP y puntos siempre, también al REPETIR un día: ¿cuántas
   repeticiones del día más generoso hacen falta para subir de rango sin avanzar en la
   historia? Calcúlalo con lo medido y dilo, aunque sea una decisión de diseño y no un fallo.
4. **Tienda.** Puntos por día contra precio de cada cosa: ¿en cuántos días se compra? ¿Hay
   algo que se compre el primer día o que nunca alcance?
5. **Dificultades.** PRÁCTICA < NORMAL < PESADILLA en lo que dan y en lo que cuestan, sin cruces.

## 4. Informe

Una tabla corta con lo medido y, debajo, los hallazgos **ordenados por cuánto afectan al
jugador**. Cada uno con: el número que lo muestra, por qué importa y una propuesta concreta.
Termina con: "No medido: …".

## 5. Si el usuario acepta un cambio

- Se pregunta qué hallazgos quiere (AskUserQuestion, varias opciones); no se cambia nada antes.
- Cambiar una cifra de balance es un **arreglo**: sube el número pequeño (ver `VERSIONES.md`),
  con su entrada en `NOVEDADES` en español e inglés, `CACHE` de `sw.js` a la par y fila en
  `VERSIONES.md`.
- Si toca `RANGOS`, actualiza la prueba de rangos de `test/logica.test.mjs`, que usa las
  medidas reales.
- Corre `node scripts/validar.mjs`, `node --test test/*.test.mjs` y `node scripts/regresiones.mjs`.
- **Nunca se toca la base de datos (Supabase)** ni se publica sin la aprobación del usuario.
