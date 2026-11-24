# LOGROS · renovación visual (piloto v40.21, integrado en v40.22)

> **Nota (v40.25):** el modo 4K HD OLED se quitó del juego. Lo que este plan dice de él ya no aplica; el resto sigue vigente.

## Realizado en esta entrega

- Fondo exclusivo de sala arcade nocturna para LOGROS, con zona inferior violeta y tarjetas sobre placas oscuras. Asset `img/logros/sala-logros.webp`, incluido en la caché offline.
- Treinta sprites transparentes de 40 × 40 píxeles. Hay 19 propios para los logros normales, diez distintos para cada secreto al descubrirse y un candado común mientras están ocultos. Se asignan por id en `js/records.js`; los textos y condiciones continúan sin cambios.
- Hojas originales en `arte/logros/` y `arte/logros-fuente.png`. La exportación se reproduce con `sh scripts/build-logros-piloto.sh` e ImageMagick 7. Los PNG finales se precargan en `sw.js`.
- Galería `MUESTRA/Galeria_30_sprites_logros.png` para inspeccionar todos los diseños juntos y montaje `MUESTRA/LOGROS_conjunto_visual.png` para ver la composición con tarjetas. El montaje es una referencia sobre capturas de v40.21, no una captura de navegador del juego.

## Siguientes partes, una por una

1. Ajustar la jerarquía de cada tarjeta para separar icono, nombre, dificultad y pista; verificar nombres largos en móvil y modo legible.
2. Distinguir la zona secreta disponible de la que aún no puede conseguirse, conservando las pistas y el misterio.
3. Mostrar una miniatura de la recompensa cosmética al conseguir un secreto.
4. Revisar en el juego real escritorio y móvil, español e inglés, retro/OLED, contraste, accesibilidad y uso offline. Pasar el ZIP a Claude para integrar en una rama y asignar una versión libre. No unir a main antes de la revisión del usuario.

Integrado en el juego como v40.22 (VERSION y caché `pa4-v40.22`); el piloto original conservaba v40.21.
