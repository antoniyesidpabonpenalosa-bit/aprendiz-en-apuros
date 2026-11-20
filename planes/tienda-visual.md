# TIENDA · piloto visual v40.21 (integrado en v40.23)

Esta entrega lleva la tienda a un mostrador arcade nocturno coherente con LOGROS.
La captura de referencia del usuario muestra nueve accesorios adquiridos, gato
equipado, dos mejoras adquiridas y 4106 puntos.

## Entregado

- Fondo específico `img/tienda/oficina-nocturna.webp`.
- Cinco sprites de 40 × 40, transparentes: `vida.png`, `tiempo.png`, `iman.png`,
  `doble.png` y `escudo.png` en `img/tienda/`; fuente en `arte/tienda/`.
- El arte de los nueve accesorios sigue siendo el canvas del avatar, para que
  coincida con lo que lleva puesto el personaje.
- Encabezado con puntos y acceso al probador; secciones de accesorios y mejoras;
  tarjetas con placa oscura y estados distintos para compra, propiedad y equipo.
- Precarga offline de los seis recursos en `sw.js`.

La compra, los precios, los efectos, el progreso y los manejadores de eventos no
cambian. El piloto conservaba `VERSION` y `CACHE` en v40.21; integrado como v40.23 (caché `pa4-v40.23`). Claude debe
integrar estas diferencias en su versión de trabajo, ajustar versión y caché
según el proyecto y revisar el resultado en el navegador en escritorio, móvil,
español, inglés, modo retro y modo legible. El servidor de esta sesión no pudo
abrir Chromium en su entorno; las pruebas automatizadas de lógica sí pasan.
