# Plan: el campus nocturno HD de la portada (v36)

> Estado: **hecho (v36)**. Paquete del autor sobre la v26.1, que no tenía nuestro fondo de la v27.
> Se integró a mano sobre el mismo mecanismo de la v27, sustituyendo la ciudad.

## Qué cambia

- `#fondo` lleva la capa `.campus-hd` (escenario, dos de estrellas, dos de nubes, ventanas y
  velo) en vez de `.ciudad`. Recursos en `img/portada/` (ver `arte/portada/LEEME.md`).
- `js/fondo.js`: `fondoPantalla(id)` pone `#app.fondo-campus` solo en 'titulo' y solo con el
  escenario ya cargado; si falla, montañas. El mismo listener de `visibilitychange` de siempre
  pausa las animaciones con la pestaña oculta.
- Movimiento reducido: nada se anima ni cambia de brillo.
- Contraste de los textos pequeños de la portada (consola, borrar, «pulsa start») sobre el
  escenario: con placa y sombra, solo mientras el campus se ve.
- `sw.js`: las 6 imágenes nuevas en la caché; salen las 2 de la ciudad.

## Diferencias con el parche del paquete

- **Sin `:has()` ni un segundo listener:** el parche activaba el fondo con
  `#app:has(#screen .portada)` y añadía otro `visibilitychange` en `js/principal.js`. Aquí se
  reutiliza la clase que pone `pantalla()` y el listener de `js/fondo.js`: funciona igual en
  navegadores sin `:has()` y solo se activa cuando el escenario cargó (nunca un fondo vacío).
- **Las montañas se esconden** mientras el campus se ve (el parche solo pausaba su animación).
- **La ciudad de la v27 se retira** entera (capa, CSS, imágenes, caché y pruebas), como pedía el
  autor, para no duplicar fondos.

## Qué no cambia

El menú (distribución, botones, título, aprendiz, iconos, ficha, transiciones, barras), las
mecánicas y las demás pantallas.
