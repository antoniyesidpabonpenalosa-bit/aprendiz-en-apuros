# Plan: transiciones y efectos de selección de la portada (paso 6 y último del rediseño)

> Estado: **hecho (v32)**. Paquete del autor (parche sobre la v26.1 + pasos 4 y 5). Los
> cambios de `js/efectos.js` y `css/estilos.css` aplicaron limpios; los de `js/menus.js` se
> trasladaron a mano porque el aprendiz animado (v29) movió `rTitulo()` de sitio.

## Qué hace

- **Entrada suave**: la portada aparece con un fundido corto (0,24 s, de 0,72 a 1 de opacidad)
  solo al LLEGAR (primer pintado o desde otra pantalla). Repintarla al cambiar dificultad, HD,
  texto o idioma no la repite. En la portada se quita el fundido general de `#screen`; la
  cortina pixelada del router (`FX.cortina`, al cambiar de pantalla) sigue igual y sale una vez.
- **JUGAR**: 10 chispas verdes y una onda de energía.
- **Dificultad**: 6 chispas doradas y un destello dorado (`.portada-confirmada`) en la elegida.
- **Demás botones de la portada**: 6 chispas violetas y cian; «borrar progreso», neutras.
- **Iconos**: se levantan 2 px al pasar el ratón (solo con puntero fino) o con el foco del
  teclado; la flecha de Mi Avatar se desplaza 3 px.

## Cómo está hecho

- Mismo motor FX (`js/efectos.js`): ni lienzo, ni bucle, ni temporizador, ni audio nuevos.
- En la portada el efecto sale en `click` (captura) en vez de `pointerdown`: un grupo de
  chispas por activación, también con teclado (Enter/Espacio, en el centro del botón) y toque.
  Fuera de la portada, los botones siguen con su efecto de siempre en `pointerdown`. El toque se
  sigue anotando igual para los efectos de acierto y fallo.
- No intercepta ni retrasa el clic: la navegación es inmediata.
- `quieto()` (prefers-reduced-motion) → sin chispas; el CSS anula entrada, destello,
  transiciones y desplazamientos. El foco sigue visible.
- No cambian mecánicas, navegación, progreso, guardado ni Supabase.

## Fin del rediseño de la portada

Pasos: fondo (v27), título (v28), aprendiz (v29), botones (v30), ficha (v31), transiciones (v32).
