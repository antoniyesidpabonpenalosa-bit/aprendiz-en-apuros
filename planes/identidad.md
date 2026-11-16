# Plan: identidad y personalización (v40 a v40.6)

> Estado: **hecho (v40 a v40.5), las seis partes**. Paquete del autor sobre la v39 (`identidad-v40.patch`):
> aplicó limpio. Se añadieron 8 casos al barrido del navegador y se regeneró el design system.

## Qué hay

- `S.apariencia`: `masculina` (por defecto, también para partidas viejas o valores raros) o
  `femenina`. Solo cambia el dibujo; viaja en `pa3` y en el código de exportar/importar.
- Mi Avatar abre en la pestaña APARIENCIA: dos tarjetas con `aria-pressed`, retrato y cuerpo
  entero a la vez, GIRAR (8 direcciones) y CAMINAR (desactivado con «reducir movimiento»).
- `APRENDIZ.dibujar()` y `dibujarPortada()` eligen el atlas según la apariencia, así que la
  aprendiz sale en la portada, el mapa, el pasillo, el runner y el jefe sin tocar esas pantallas.
  Los NPC siguen con su sprite propio (o el clásico con colores hex).
- Atlas femeninos: `img/aprendiz-femenina-caminar.png` (176×592, filas S, SE, E, NE, N, NW, W,
  SW) y `img/aprendiz-femenina-portada.png` (176×74: reposo, parpadeo, transición, saludo). El
  recoloreo usa paletas exactas de camisa y piel; pelo y pantalón no cambian.
- Retrato 16×16 y 32×32 con peinado femenino; los accesorios siguen igual.
- Comprar un accesorio con una confirmación vieja ya no cobra dos veces.

## Parte 2 (v40.1): masculino premium

- `img/aprendiz-masculino-premium-caminar.png` (176×592) y `-portada.png` (176×74: reposo,
  parpadeo, saludo A y B), refinados desde los HD de v33 con `scripts/build-aprendiz-masculino.py`
  (Pillow); contrato en `arte/aprendiz-masculino-premium/`.
- `APRENDIZ` prefiere el premium para el jugador masculino; si no carga, el HD anterior y luego el
  clásico. Misma paleta exacta de piel y camisa que el femenino. Paquete aplicado limpio; se
  arregló la fila de VERSIONES.md (estaba fuera de la tabla) y se añadió un caso al barrido.

## Parte 3 (v40.2): retratos de los protagonistas

- `js/retratos-aprendiz-arte.js` (datos RLE generados por `scripts/build-retratos-protagonistas.py`,
  fuentes en `arte/retratos-protagonistas/`) y `js/retratos-aprendiz.js`: retrato del jugador en
  16×16, 32×32 y busto de cine 48×48 (en un lienzo de 96) con 5 gestos y parpadeo, recoloreo de
  piel y camisa y los 9 accesorios.
- `CARAS.yo()` lleva `protagonista:true`; `retrato()` lo dibuja con el módulo nuevo y los demás
  siguen con `cara`/`cara32`. `CINE.montar()` le pasa el gesto: una página futura
  `{quien:'APRENDIZ',gesto:'preocupado',t:'…'}` lo enseña. Ninguna escena actual cambia de cara
  (comprobado en el barrido).
- Arreglo al integrar: a 16×16 las gafas y los audífonos reducidos desde 48 tapaban los ojos con
  una franja negra; ahora se pintan con píxeles propios de 16.

## Parte 4 (v40.3): tarjetas de piel y camisa

- `peTarjetasColor()` en `js/tienda.js`: 4 tarjetas de piel con el retrato real (32×32) y 4 de
  camisa con el cuerpo entero de la apariencia actual, nombre del color en ES/EN, muestra,
  selección dorada con ✓ y estado EQUIPADO/ELEGIR, `aria-pressed`. Elegir guarda al instante y
  no vuelve a guardar si ya estaba. Se repintan al cambiar apariencia o color y al cargar atlas.
- Mismas paletas `SKINS`/`CAMISAS` e índices; ni compras ni accesorios cambian. Paquete aplicado
  limpio (salvo la fila de VERSIONES.md); dos casos nuevos en el barrido.

## Parte 5 (v40.4): accesorios sobre el cuerpo y probador

- `ACC_ARTE` (js/sprite.js): los 9 accesorios en pixel art dibujados sobre el cuadro del jugador
  (8 direcciones, 4 pasos, las dos apariencias); `APRENDIZ.dibujar/dibujarPortada` reciben `acc`
  (por defecto `S.acc`), así salen en portada, mapa, pasillo, runner y jefe. Los NPC no los
  llevan; el ancla, la caja de choque y la velocidad no cambian.
- Mi Avatar: tocar un accesorio solo lo PRUEBA (no toca `S` ni el guardado); EQUIPAR o COMPRAR Y
  EQUIPAR lo confirman. Cancelar o cambiar de pestaña descartan la prueba. Un solo accesorio.
- Tienda: iconos pixel y botón PROBAR ACCESORIOS; su compra directa no cambia. Precios iguales.
- Al integrar: la prueba del barrido de la ficha de la portada (v31) equipaba con un toque; ahora
  toca y confirma. Seis casos nuevos. La campaña de 15 días jugada por el robot con un accesorio
  distinto cada día y las dos apariencias termina sin errores y sin cambiar accesorio ni inventario.

## Parte 6 (v40.5): Mi Avatar definitivo

- Vestidor en `rPerso()`: vistas ambos/retrato/cuerpo (solo en memoria, `peVista`), giro en los
  dos sentidos con el nombre de la dirección, caminar, detalle 16/32; selectores rápidos de piel
  y camisa que pulsan las mismas tarjetas; atajo al probador; colección con barra; el HUD se
  refresca al comprar. Sin campos nuevos en el guardado.
- Comprobado al integrar las seis partes: barrido completo, caché real del service worker sin
  red (`pa4-v40.5`) y migración de una partida de v39. Cuatro casos nuevos en el barrido; uno de
  v40.1 ajustado (las gafas de v40.4 tapan el parpadeo de la portada).

## Retoques al integrar (v40.5, pedidos por el autor)

- La gorra del retrato del protagonista usa los azules de la del cuerpo y la tienda (antes verde).
  El dibujo antiguo de `cara`/`cara32` sigue verde: es también la gorra del vigilante.
- A 16×16, el ojo izquierdo de la aprendiz quedaba pegado a la sombra del flequillo; ahora tiene
  piel a los dos lados.

## Reparación visual (v40.6)

Paquete `reparacion_visual_avatar` del autor: los retratos tenían ojos, boca y barba mal, no coincidían con el cuerpo
y no eran dibujos propios de cada tamaño (se recortaba el atlas del cuerpo y se reducía). Lo que se hizo:

- **Retratos nuevos** (`scripts/build-retratos-protagonistas.mjs`, sin dependencias): las formas grandes salen de los
  mismos polígonos rasterizados a cada tamaño y los rasgos (ojos, cejas, nariz, boca) están dibujados a mano para cada
  tamaño y gesto; a 16×16 la cabeza entera es un mapa propio. Nuevo esquema de datos (`frames[apariencia][tamaño][gesto]`,
  `acc[accesorio][apariencia][tamaño]`); `RETRATOS_APRENDIZ.dibujar` y sus consumidores no cambian. Se quitó la
  sobrescritura genérica de ojos a 16.
- **Caras del cuerpo** (`scripts/build-caras-cuerpo.mjs`, idempotente): masculino con barba completa, cejas y ojos del
  retrato en S, SE, E, W y SW y en las 4 poses de portada (la cabeza es idéntica en los 4 cuadros). Solo se repinta el
  interior de la cara: silueta, pelo, pies, anclaje y los 16 colores no cambian.
- **Femenina, sin salto de cabeza:** la columna de reposo era otro dibujo (cabeza más pequeña) que las de caminata. El
  reposo pasa a ser la pose de «paso» (columna 2), así el ciclo es paso, zancada A, paso, zancada B. Consecuencia: parada,
  ella ya no está perfectamente recta y de frente, sino en mitad de un paso. **Pendiente de la aprobación del autor.**
- **Gato** nuevo (frente y espalda, con cola) en cuerpo, retrato (3 tamaños) e icono; **gafas** de cristal transparente
  alineadas con los ojos de cada personaje; los 9 accesorios comparten colores entre cuerpo y retrato (lo comprueba una prueba).
- Expresión neutra en Mi Avatar (`01-expresion-neutra.patch`).

## Fuera de esta parte

- No hay diálogos nuevos del protagonista.
- La sala de clase no sincroniza la apariencia (el proyector sigue con los campos de antes).
- No hay pantalla de elección al empezar partida: se elige en Mi Avatar.

## Siguiente

Los diálogos del protagonista, cuando se apruebe la biblia narrativa; la apariencia en la sala
de clase si se pide.
