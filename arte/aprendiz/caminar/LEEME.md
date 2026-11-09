# Aprendiz en apuros — Caminata pixel art

**Basado en el sprite original del juego** `aprendiz.png`. Se conservan colores, pelo, camiseta y proporciones originales; se anima el movimiento de piernas y las manos visibles, con 4 cuadros por dirección.

## Sprite sheet listo para implementar

- Archivo: `aprendiz_walk_8dirs_4frames.png`
- Transparencia: PNG RGBA
- Tamaño total: **176 × 592 px**
- Tamaño de cada cuadro: **44 × 74 px**
- Columnas: 4 cuadros de caminata
- Filas (arriba a abajo): `abajo`, `abajo_derecha`, `derecha`, `arriba_derecha`, `arriba`, `arriba_izquierda`, `izquierda`, `abajo_izquierda`
- Orden de cuadros: 0 reposo, 1 paso izquierdo, 2 transición, 3 paso derecho
- Velocidad sugerida: **120–150 ms por cuadro** (aprox. 7–8 cuadros/seg)
- **No** suavizar al escalar: usar `image-rendering: pixelated`.

## Ejemplo JS (Canvas)

```js
const FRAME_W = 44, FRAME_H = 74;
const filas = { abajo:0, abajo_derecha:1, derecha:2, arriba_derecha:3, arriba:4, arriba_izquierda:5, izquierda:6, abajo_izquierda:7 };
const paso = Math.floor(performance.now() / 135) % 4;
ctx.imageSmoothingEnabled = false;
ctx.drawImage(spriteSheet, paso * FRAME_W, filas[direccion] * FRAME_H, FRAME_W, FRAME_H, x, y, FRAME_W * escala, FRAME_H * escala);
```

También se incluyen los **32 PNG individuales**, una vista previa ampliada y cuatro GIF de ejemplo.
