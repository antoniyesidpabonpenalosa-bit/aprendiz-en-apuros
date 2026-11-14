# Plan: mejorar el estilo pixel art

> Estado: **A, B y C hechas (v25).** D y E quedan abiertas, a decisión del autor.
> Se partió de mirar el juego en un móvil (2026-11-14): lo que desentonaba eran
> los emojis del sistema, el jefe hecho de emojis y los retratos ilustrados.

## Hecho en la v25

- **A · Iconos pixel propios** (`js/iconos.js`): rejillas de 12×12 dibujadas a mano
  para los 15 días, las dificultades, el candado, el sonido (3 estados), la ❌, el
  menú principal (tienda, logros, récords, stats, modos) y los tipos de minijuego.
  `pxi('☕')` da la imagen para una plantilla HTML; `pxiDibujar(c,'🐛',x,y,esc)` la
  pinta en un canvas. Si una clave no tiene dibujo, sale el emoji de siempre: se puede
  ir cambiando de a poco.
- **B · El jefe en pixel:** un dibujo de 16×16 por fase (`jefe1`, `jefe2`, `jefe3`),
  cada uno más furioso, y las ❌ que caen. Los obstáculos del runner también.
- **C · Paleta única:** cada letra de los dibujos es una variable de `:root` en
  `css/estilos.css` (las cinco rampas verde, amarillo, violeta, naranja, azul y rojo,
  más los grises). Una prueba (`test/iconos.test.mjs`) falla si los colores se separan.
  No se estrenó ningún color.

Los iconos se ven nítidos en múltiplos de 12 px (12, 24, 36, 48); el CSS los fija así
donde el texto de alrededor es chico.

## Lo que sigue sin dibujo (sigue siendo emoji)

La tienda y sus artículos (☕🤓👔…), los logros, las cutscenes (🎒📅😅), la portada de
cada minijuego en el modo reto/sin fin, las casillas del Caza-bugs (💣…) y algunos
textos sueltos. Se pueden ir sumando a `PXI` sin tocar nada más: la prueba de cobertura
de `test/iconos.test.mjs` dice qué se exige.

## Abierto

- **D · Retratos en pixel.** Los 20 retratos son ilustraciones suaves y desentonan con
  el resto. Idea: un script que los reduzca a ~64 px, los cuantice a la paleta y los
  escale sin suavizar; la ilustración queda como opción. Probar primero con uno.
- **E · Pasillo dibujado en pixel:** baldosas con trama, luces, carteles, plantas y una
  animación de respiración en los personajes (hoy el fondo es CSS plano).
- **Composición:** las pantallas de introducción dejan mucho espacio vacío arriba y abajo.
