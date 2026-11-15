# Plan: identidad y personalización (v40, parte 1)

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

## Fuera de esta parte

- El protagonista masculino no se rediseña; los accesorios no se dibujan sobre el cuerpo entero.
- La sala de clase no sincroniza la apariencia (el proyector sigue con los campos de antes).
- No hay pantalla de elección al empezar partida: se elige en Mi Avatar.

## Siguiente

Rediseño del protagonista masculino y sus retratos; después, el probador de accesorios de
cuerpo entero (paquetes aparte).
