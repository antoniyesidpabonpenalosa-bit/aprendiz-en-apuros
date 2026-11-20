# RÉCORDS · piloto visual v40.21 (integrado en v40.24)

La captura del usuario muestra la pantalla inicial sin conexión, sin marcas
locales y con rango ASPIRANTE. Esta entrega da a esa situación un estado
visual deliberado, sin cambiar la consulta ni la clasificación.

## Cambios

- Fondo exclusivo `img/records/salon-de-la-fama.webp`, con trofeos a los
  extremos y centro oscuro para sostener los paneles. Está precargado en `sw.js`.
- Marcador global y marcas locales sobre placas; filtros activos y foco de
  teclado más claros; tablas con marco y desbordamiento horizontal controlado.
- Mensajes de carga, sin conexión y sin registros con la misma jerarquía.
- Escalafón con ordinales, estado actual destacado y valores de XP legibles.
- Los datos, filtros, acceso al grupo, clasificación y llamadas a RANKING
  mantienen su lógica. No hay nuevo marcador ni cambio de puntuaciones.

El piloto conservaba `VERSION` y `CACHE` en v40.21; integrado como v40.24 (caché `pa4-v40.24`). Al
integrarlo en una rama más nueva, comparar los archivos y adoptar los cambios
por sección. Comprobar en navegador en español e inglés, escritorio y móvil,
con red/sin red, registros vacíos/ocupados y temas retro/legible. En este
entorno Chromium no pudo abrirse; sí se ejecutaron el validador y 355 pruebas.
