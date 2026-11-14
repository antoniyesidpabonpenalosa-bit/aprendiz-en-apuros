# Plan: el fondo del menú principal

> Estado: **primera entrega hecha (v27)**: solo el fondo animado. El menú en sí (botones,
> disposición, textos) no se tocó; el autor quiere aprobar primero el fondo y después mejorar
> el resto de la pantalla.

## Qué es

Una ciudad nocturna en pixel art (azul noche, ventanas verdes y violetas, estrellas que
titilan, nubes) creada con ChatGPT y aportada por el autor (`arte/fondo/`). Los recursos que
carga el juego están en `img/fondo/`: `ciudad-atlas.png` (1647×932: 3 columnas × 2 filas de
549×466, 6 cuadros) y `ciudad-estatica.png` (el primer cuadro, para "reducir movimiento").
El GIF del paquete no se usa.

## Cómo está hecho

- **Solo en la portada.** `pantalla()` (`js/nucleo.js`) llama a `fondoPantalla(id)`
  (`js/fondo.js`), que pone la clase `fondo-ciudad` en `#app` cuando la pantalla es `titulo`.
  Sin esa clase la capa `.ciudad` no existe (`display:none`) y las montañas de siempre se ven.
- **Sin bucles de JavaScript.** Los 6 cuadros los recorre una animación de CSS con `steps()`;
  un cuadro dura `--ciudad-ms` (800 ms, en `css/estilos.css`; cualquier valor de 600 a 1000 ms
  es tranquilo). Al salir del menú la capa se esconde y la animación se para; las montañas se
  esconden (y paran sus animaciones) mientras la ciudad está. Nunca corren las dos.
- **Encuadre "cover" sin deformar.** La capa mide `max(100cqw, 100cqh·549/466)` ×
  `max(100cqh, 100cqw·466/549)` (unidades de contenedor sobre `#fondo`) y se recorta por el
  centro. Los píxeles se mantienen con `image-rendering: pixelated`. Detrás del HUD y de todo,
  con `pointer-events: none`.
- **Legibilidad.** Una capa oscura semitransparente (40 % arriba, 14 % en medio, 36 % abajo);
  una prueba mide que el texto suelto sobre el fondo conserve un contraste de 4,5:1 o más.
- **Movimiento reducido:** imagen estática y ninguna animación (y ni se pide la hoja animada).
  **Pestaña oculta:** animación en pausa.
- **Respaldo:** si la imagen no carga, o el navegador no sabe unidades de contenedor, el menú
  se queda con las montañas.
- **Sin conexión:** las dos imágenes y `js/fondo.js` están en la caché del service worker.

## Lo que se vio al integrarlo

- En un móvil vertical, "cover" recorta la ciudad a ~42 % de su ancho y la amplía 1,6×: se ven
  edificios grandes, ventanas y estrellas, pero no el panorama entero. En escritorio y tablet
  se ve mucho más. Si el autor prefiere ver toda la ciudad en el móvil, la alternativa es
  encajarla por el ancho (sin recortar) y prolongar el cielo por arriba y el suelo por abajo
  con el color del borde de la imagen; no se hizo porque el encargo pedía "cover".
- Las nubes avanzan ~25 px por cuadro: a 800 ms por cuadro dan pasos, no un deslizamiento
  continuo (es lo propio del pixel art por cuadros).
- Rendimiento medido en un móvil emulado (3× de densidad) con la CPU frenada 1×, 4× y 6×: 60 fps
  con la ciudad igual que con las montañas.

## Siguiente

Mejorar el resto de la pantalla principal, después de que el autor apruebe el fondo.
