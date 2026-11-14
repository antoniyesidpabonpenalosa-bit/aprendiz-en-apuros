# Arte nuevo del aprendiz (v33)

Paquete del autor (diseño de ChatGPT). Recursos de producción en `img/`:

- `img/aprendiz-caminar-hd.png` — 176×592, RGBA: 8 filas (south, south-east, east, north-east,
  north, north-west, west, south-west) × 4 columnas (0 reposo, 1 contacto izquierdo,
  2 transición, 3 contacto derecho), cuadros de 44×74 con los pies en la base; 135 ms por cuadro.
  El mismo contrato que `img/aprendiz-caminar.png`, así que `APRENDIZ.dibujar` no cambia.
- `img/aprendiz-portada-hd.png` — 176×74, RGBA: 0 reposo, 1 parpadeo, 2 y 3 saludo
  (`APRENDIZ.dibujarPortada`, solo en la portada).

La camisa (23,104,157) y la piel (245,203,154) de referencia son las que remapea el recoloreo de
`js/sprite.js`, así que valen las 4 pieles × 4 camisas sin tocar datos guardados.

El atlas clásico (`img/aprendiz-caminar.png`, fuentes en `arte/aprendiz/`) NO se reemplaza:
lo siguen usando los personajes del pasillo (sus colores van en "#rrggbb") y es el respaldo
del jugador si el nuevo no carga. `manifest.json` es la descripción del paquete original.

Fuera de esta entrega: accesorios en el cuerpo entero y la cara de Mi Avatar (siguen como estaban).
