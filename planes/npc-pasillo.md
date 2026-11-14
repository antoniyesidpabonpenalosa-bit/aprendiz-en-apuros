# Plan: sprites propios de los personajes del pasillo (v38)

> Estado: **hecho (v38)**. Paquete del autor sobre la v26.1. `js/npc-sprites.js`, `js/pasillo.js`,
> `index.html` y la prueba aplicaron limpios; `sw.js` se completó a mano.

## Qué cambia

- `NPC_PASILLO.dibujar(ctx, id, x, yPie, alto)` (js/npc-sprites.js, cargado antes de
  js/pasillo.js): pinta la celda de cada personaje del atlas `img/npc/pasillo.png`.
- `pintaGente()` (js/pasillo.js) lo intenta primero; si no está, el cuerpo del aprendiz
  recoloreado de siempre; si tampoco, los rectángulos. Al terminar de cargar el atlas se repinta
  una vez (solo si se sigue en el pasillo).
- `sw.js`: el atlas y el módulo en la caché sin conexión.

## Qué no cambia

El sprite del jugador (v33), los 20 retratos, nombres, consejos, diálogos y sitios de cada
personaje, las puertas y el pasillo HD (v37), los niveles, el progreso y las recompensas.
