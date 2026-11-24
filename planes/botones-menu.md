# Plan: botones e iconos de la portada (paso 4 del rediseño de la portada)

> **Nota (v40.25):** el modo 4K HD OLED se quitó del juego. Lo que este plan dice de él ya no aplica; el resto sigue vigente.

> Estado: **hecho (v30)**. Paquete del autor (parche sobre la v26.1). El parche no aplicaba solo
> (el CSS cambió con el fondo, el título y el aprendiz), así que se hizo como pedía su LEEME:
> el bloque de `botones-portada.css` se añadió **una vez** al final de `css/estilos.css` y las dos
> modificaciones de `js/menus.js` se trasladaron a `rTitulo()`.

## Qué cambia

- Tarjetas (`.menu-fila`) con relieve y bisel; los tres modos en violeta sobrio, los demás accesos
  en azul. El icono va en una placa discreta (`.m-ico`).
- Dificultad (`.dif-op`): elegida en dorado.
- JUGAR (`.btn-jugar`) verde con bisel; Reto diario (`.tit-reto`) morado.
- Estados hover, active y focus; modo HD (esquinas suaves) y texto legible (conserva tamaños y
  fuente); en movimiento reducido no hay desplazamiento al pulsar.
- Los iconos son los de `js/iconos.js` (`pxi()`), escalados a 36 px en escritorio y 24 px en
  pantallas pequeñas. Sin imágenes, fuentes ni recursos nuevos (solo cambia el `CACHE` de `sw.js`).

## Cómo está hecho

- **CSS**: todo bajo `.portada`, así que no toca las demás pantallas ni la tarjeta Mi Avatar
  (paso 5).
- **JS** (`rTitulo()`): `aria-pressed` en los botones de dificultad, y con el teclado el foco
  vuelve a la dificultad elegida al repintar (antes se perdía).
- No cambian botones, traducciones, rutas, dificultad, XP ni guardado.

## Fuera de alcance

Tarjeta Mi Avatar (paso 5), transiciones globales (paso 6), HUD, pasillo y combate.
