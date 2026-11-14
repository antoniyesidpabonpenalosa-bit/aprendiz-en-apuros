# Plan: barras de XP y progreso estilo RPG (v35)

> Estado: **hecho (v35)**. Paquete del autor sobre la v26.1. `js/graficos.js`, `js/nucleo.js` y la
> prueba aplicaron limpios; `js/menus.js` (portada y ficha) y el CSS se integraron a mano.

## Qué cambia

- `barraRpg(tipo, valor, max, desde, decorativa)` (js/graficos.js): un medidor con pista fija y
  divisiones dibujadas en la pista (no en el relleno). Tipos: `xp` (violeta, 10 casillas),
  `campana` (verde, 15 casillas = `TOT_DIAS`) y `hud` (verde compacto, 6). Borde dorado al 100 %.
- Portada: la XP con «XP · → siguiente rango» y el porcentaje encima, y las cifras debajo; la
  ficha Mi Avatar (v31) usa la barra de campaña (decorativa: dentro de un botón no hay roles
  anidados; la cifra «7/15» y el % siguen visibles). El HUD de la portada usa la barra compacta.
- Resultado de un día: la barra crece en 780 ms desde el % anterior, o desde 0 si se subió de
  rango. Solo la primera vez: al cambiar de idioma no se repite. La columna de luz de subida de
  rango (PX.nivel) sigue igual. Con «reducir movimiento» no se anima.
- **Placa oscura detrás del bloque de XP de la portada** (añadido nuestro): sin ella las cifras
  quedaban sobre ventanas encendidas del fondo animado y bajaban a 2,6:1 de contraste.

## Qué no cambia

`progresoXp()`, `progreso()`, `TOT_DIAS`, la XP ganada, los requisitos de los rangos, las
recompensas, el resultado de los modos libre, diario, sin fin y sala, y el guardado.
