# Plan: el aprendiz animado de la portada (paso 3 del rediseño de la portada)

> Estado: **hecho (v29)**. Paquete del autor (parche sobre la v26.1). Se integró **a mano**: el
> parche ya no aplicaba por los cambios del fondo (v27) y del título (v28) en `rTitulo()`.

## Qué hace

El aprendiz de cuerpo entero, junto a JUGAR, con la piel y la camisa del jugador:

- **Respira:** la mitad de arriba sube un píxel cada 0,65 s; los pies no se mueven.
- **Parpadea:** cada 4,1 s, 140 ms.
- **Saluda:** cada 12 s, ~1 s, con un brazo de pixeles que alterna de pose cada 170 ms.
- **Reacciona a JUGAR:** al pasar el puntero, al enfocarlo con teclado y al tocarlo (`pointerdown`,
  que ocurre *antes* del clic: no lo retrasa). El saludo a petición dura 1,05 s.
- **Reducir movimiento:** se pinta una vez, quieto.

## Cómo está hecho (`js/menus.js`, `css/estilos.css`)

- Reutiliza `APRENDIZ.dibujar` y el atlas `img/aprendiz-caminar.png` (sin recursos nuevos ni
  cambio en `sw.js`, salvo la versión). Los GIF y PNG del paquete no se usan.
- Lienzo de 56×80, `aria-hidden` y `pointer-events:none`: no intercepta toques. El botón JUGAR y
  su controlador no se tocaron.
- `tcada(pinta,100)` (10 cuadros por segundo) con el temporizador del juego: `pantalla()` lo
  limpia al salir de la portada, así que no queda ningún bucle. **Solo se redibuja cuando algo
  cambia** (el parche repintaba siempre). Quieto con la pestaña oculta, en pausa o fuera de la
  portada.
- La cuenta de qué toca en cada instante está aparte (`portadaEstado`, con sus constantes en
  `PORTADA`) y se prueba en `test/portada.test.mjs`.
- Los colores del brazo y del párpado se leen una vez del sprite ya recoloreado (conservan su
  sombreado) y se guardan por combinación de piel y camisa; si el navegador no deja leerlos
  (`file://`), se usan los colores elegidos tal cual.
- CSS: `.tit-jugar-fila` (el aprendiz y el marco de JUGAR en fila). Ancho del aprendiz entre 56 y
  112 px (48 en pantallas de hasta 360 px; en escritorio, según el alto, de 56 a 100 px).

## Cambios respecto al parche

- Aplicado a mano sobre `rTitulo()` actual; conserva el fondo y el título.
- Se redibuja solo al cambiar el estado; los colores se calculan una vez; el reintento con
  movimiento reducido espera al atlas hasta 8 veces (el parche solo 3).
- `pointerdown` además de `pointerenter` y `focus`; `10vh` en vez de `10cqh` (no hay contenedor).

## Fuera de alcance (como pedía el paquete)

El aprendiz no lleva los accesorios equipados (gafas, gorra…): solo la piel y la camisa.
