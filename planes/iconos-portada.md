# Plan: iconos de 32×32 de la portada (v34)

> Estado: **hecho (v34)**. Paquete del autor sobre la v26.1. `js/iconos.js` y la prueba aplicaron
> limpios; las llamadas de `rTitulo()` se cambiaron a mano (la función cambió en v27–v33).

## Qué cambia

- `pxiPortada(clave)` (js/iconos.js): `<img class="pxi pxi-portada">` con el PNG incrustado, o el
  `pxi()` clásico si no hay diseño de 32. Las 15 claves: 🎮 ♾️ 🏫 🌱 ⚔️ 💀 🛒 🏆 📊 📈 ✨ 🔤 🎓 🗓 🕹.
- En `rTitulo()`: las 9 tarjetas, las 3 dificultades, el reto diario, el rango de la cabecera y el
  rango de la ficha Mi Avatar (v31). La llama de la racha sigue con su icono clásico.

## Tamaños (css/estilos.css, bloque «Iconos premium de la portada»)

- Tarjetas: 36 px en escritorio (lo del paso 4) y **32 px en móvil** (antes 24): escala exacta
  en pantallas 1×, 2× y 3×; la placa del icono pasa de 32×30 a 38×36.
- Dificultad, reto, cabecera (24 px) y ficha (16 px) no cambian de tamaño; en pantallas 1× se
  reducen suavizando para no perder filas de píxeles.

## Qué no cambia

`pxi()`, `pxiDibujar()`, `PXI`, `PXI_PAL` y todos los iconos del resto del juego, los
minijuegos y el HUD; mecánicas, precios, dificultad, progreso y navegación.
