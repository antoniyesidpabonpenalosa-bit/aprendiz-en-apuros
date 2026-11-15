# Plan: identidad y personalización (v40 a v40.3)

> Estado: **hecho (v40), primera parte**. Paquete del autor sobre la v39 (`identidad-v40.patch`):
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

## Fuera de esta parte

- Los accesorios no se dibujan sobre el cuerpo entero; no hay diálogos nuevos del protagonista.
- La sala de clase no sincroniza la apariencia (el proyector sigue con los campos de antes).
- No hay pantalla de elección al empezar partida: se elige en Mi Avatar.

## Siguiente

El probador de accesorios de cuerpo entero y el pulido de Mi Avatar (paquetes aparte); los
diálogos del protagonista, cuando se apruebe la biblia narrativa.
