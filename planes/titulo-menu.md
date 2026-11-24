# Plan: el título del menú principal (paso 2 del rediseño de la portada)

> **Nota (v40.25):** el modo 4K HD OLED se quitó del juego. Lo que este plan dice de él ya no aplica; el resto sigue vigente.

> Estado: **hecho (v28)**: solo el título. El fondo animado (v27) se conserva; el subtítulo, los
> botones, los datos y la lógica de `rTitulo()` no cambian. Siguen pendientes los demás pasos del
> rediseño de la portada.

## Qué se eligió y por qué: el PNG, con el texto de respaldo

El paquete traía dos alternativas: un PNG transparente de 920×360 (4 KB) y un CSS de texto real.
Se usó el **PNG**, porque es el diseño tal cual (relieve de tres tonos, sombra en escalón,
guiones y raya de colores integrados) y el CSS solo lo aproxima. La accesibilidad no se pierde
porque el `<h1>` de texto **sigue en el HTML**:

- Con el dibujo cargado y fuera del modo HD, el `<h1>` se esconde *a la vista* (técnica de solo
  lectores de pantalla: `position:absolute` de 1 px y `clip`, no `display:none`), y la imagen es
  decorativa (`alt=""`, `aria-hidden`): el nombre accesible sigue siendo "APRENDIZ EN APUROS"
  (hay un espacio entre las dos líneas, para que no se lea "APRENDIZEN").
- Los dos guiones de los lados se esconden: ya van dentro del dibujo. Nunca se ven los dos títulos.
- **Respaldo:** si la imagen no carga, la clase `con-imagen` no se pone y sale el texto de siempre.
- **Modo HD:** conserva su título de texto (HD cambia la tipografía de todo el juego; un dibujo
  de pixel art desentonaría). El modo **texto legible** no toca el título, así que ve el dibujo.
- `image-rendering: pixelated`; ancho `min(100%, 460px)`, alto automático, sin deformar.
- La imagen se pide una vez al abrir el juego (`js/menus.js`) y está en la caché sin conexión.

## Dónde está

`js/menus.js` (`rTitulo()` y el bloque de carga justo encima), `css/estilos.css` (reglas
`.tit-img` / `con-imagen`, junto a `.tit-h1`), `img/titulo/`, `sw.js`. El CSS de alternativa
del paquete queda en `arte/titulo/` como referencia, sin usar.
