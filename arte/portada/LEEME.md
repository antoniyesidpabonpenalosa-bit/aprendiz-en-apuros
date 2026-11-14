# Fondo de la portada: campus nocturno HD (v36)

Paquete del autor (diseño de ChatGPT). Escenario ficticio: no reproduce una sede real.
Recursos de producción en `img/portada/`, todos de 1600×900 y con el mismo encuadre:

| Archivo | Qué es | Animación (css/estilos.css) |
|---|---|---|
| `campus-noche.webp` | el escenario, fijo (WebP calidad 94, ~165 KB) | — |
| `estrellas-1.png`, `estrellas-2.png` | dos grupos de estrellas | brillo de 0,35 a 0,85 en 11 y 17 s |
| `nubes-lejanas.png`, `nubes-cercanas.png` | dos capas de nubes | deriva de ±2,5 % en 82 y 56 s |
| `ventanas.png` | luz que se suma a las ventanas del escenario | de 0,08 a 0,7 en 13 s |

El velo oscuro que deja leer el menú es CSS (`.campus-velo`): para ajustar el contraste, solo sus
opacidades. Todas las capas van con `background-size:cover` anclado abajo al centro; en móvil se
recortan los lados sin deformar.

**Historia:** sustituye a la ciudad nocturna de la v27 (una hoja de 6 cuadros de 549×466 y una
imagen estática, antes en `img/fondo/`), que se retiró del juego, de la caché y del repositorio.
