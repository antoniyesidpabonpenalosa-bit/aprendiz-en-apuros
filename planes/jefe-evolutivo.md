# Plan: el jefe evolutivo

> Estado: **primera entrega hecha (v26)**: las tres apariencias y sus dos transformaciones.
> Recursos creados con ChatGPT y aportados por el autor (`arte/jefe/`).

## Idea

El jefe no son tres enemigos: es uno que evoluciona durante el combate.

| Fase | Vida del jefe | Nombre artístico | Aspecto |
|---|---|---|---|
| 1 | más de 66 % | El Bug | morado, pequeño y amenazante |
| 2 | más de 33 % y hasta 66 % | El Caos | naranja, con cuernos y armadura |
| 3 | 33 % o menos | El Error Fatal | rojo, con armadura y energía digital |

Nombre del conjunto propuesto: **El Error Evolutivo**. El nombre interno y las
traducciones (EL BUG FINAL) **no se cambiaron**; falta que el autor apruebe el cambio.

## Qué se hizo en la v26

- `js/jefe-sprites.js` (nuevo): los dibujos, la carga y las cuentas puras (`jefeFaseDe`,
  `jefeCuadro`, `jefeTransFin`, `jefeEsquina`).
- `js/jefe.js`: el cuadro se pinta con las poses; al cruzar un umbral arranca la
  transformación de 12 cuadros × 85 ms. No cambió nada de la mecánica: vida, velocidad,
  ataques, zona de golpe, dificultad, recompensas ni estadísticas.
- Durante la transformación el combate se detiene entero (aprendiz, balas, errores, rayo
  y reloj `frame`), así que nadie recibe daño sin poder esquivarlo. La cuenta va en
  milisegundos con un tope de 50 ms por fotograma: pausar, cambiar de pestaña o un tirón
  no se la comen ni se saltan cuadros.
- Se dispara una sola vez por cambio de fase (`trans` existe mientras dura y `faseAnt` solo
  sube al acabar). El indicador "FASE n/3" cambia al terminar.
- Con "reducir movimiento" el cambio es instantáneo. Si el atlas no carga, también; si las
  poses no cargan, se pinta el emoji de siempre.
- Las imágenes se piden al abrir el juego (en reposo) y otra vez al entrar al combate, que
  espera hasta 1,5 s a que terminen; están en la caché del service worker.

## Siguiente entrega (no hecha)

Animaciones de ataque, reposo, daño y derrota definitiva. Hoy el daño sigue siendo el
destello blanco y el retroceso de 2 px de siempre, aplicados a la pose.
