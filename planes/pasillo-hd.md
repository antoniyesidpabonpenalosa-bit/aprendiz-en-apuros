# Plan: pasillo HD (v37)

> Estado: **hecho (v37)**. Paquete del autor sobre la v26.1. `js/pasillo.js` aplicó limpio; el CSS
> (`pasillo-hd.css`, igual al del parche) y `sw.js` se añadieron a mano.

## Qué cambia

- `#pasillo-escena` lleva `pasillo-hd` además de su ambiente (`pasillo-formacion` en las zonas 1
  y 2, `pasillo-empresa` en la 3). Cada ambiente pone su techo, muro y suelo (WebP de 1774 de
  ancho, `cover`) encima del pasillo de CSS de siempre, que queda de respaldo si no cargan.
- Cada puerta: el botón y su marco quedan quietos; dentro, `span.pasillo-hoja` lleva el dibujo
  de 48×84 (cristal y manija) y es lo que gira al entrar (`rotateY(-68deg)` en 7 pasos). Con
  «reducir movimiento», sin transición.
- Letreros, insignias, ficha y botones de zona con más contraste; los nombres de zona en VT323
  de 16 px (13 en móvil) en vez de 8-10 px. Las ventanitas laterales del diseño anterior se ocultan.
- `sw.js`: los 8 recursos en la caché sin conexión.

## Qué no cambia

Las 3 zonas y las 15 puertas, `empezarDia`, desbloqueos, estados, consejos y diálogos de los
personajes (Gustavo, Valentina, Andrés, Don Jairo, con su atlas clásico), el aprendiz nuevo
(v33), la lista de días, el jefe, la dificultad, las recompensas y el progreso.
