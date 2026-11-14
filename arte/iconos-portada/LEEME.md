# Iconos de la portada (v34)

Paquete del autor (diseño de ChatGPT): 15 PNG RGBA de 32×32, transparencia binaria. Son la
FUENTE para editar; el juego no los pide por red: los mismos bytes van incrustados como
`data:image/png;base64` en `PXI_PORTADA` (`js/iconos.js`), así que no hacen falta en `sw.js`.

`manifest.json` y `atlas-iconos-menu.png` (5 × 3 celdas de 32) dicen qué clave (emoji) es cada
uno. Solo `rTitulo()` los usa, con `pxiPortada(clave)`; si una clave no tiene icono de 32,
devuelve el `pxi()` clásico de 12×12. Todo lo demás del juego sigue con `pxi()`/`pxiDibujar()`.
