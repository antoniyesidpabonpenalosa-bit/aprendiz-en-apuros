# El Error Evolutivo — recursos de transformación

Dos transiciones visuales del mismo jefe. El arte parte de la propuesta aprobada; los cuadros intermedios son efectos de disolución, cambio de color, destello y glitch compuestos a partir de las tres fases, no dibujos independientes de ataque.

- Atlas combinado: `jefe-transformaciones-atlas.png`, 1536 × 256 px, RGBA, 12 columnas y 2 filas.
- Celda: 128 × 128 px. Ancla común: centro x=64, suelo y=113.
- Fila 0: morado → naranja. Fila 1: naranja → rojo. Cuadro 0 es la fase inicial; cuadro 11 es la siguiente fase.
- Cada transición tiene 12 cuadros, 85 ms por cuadro como referencia (1,02 s). Reproducir una sola vez.
- Se incluyen 24 PNG individuales y 3 poses estáticas. GIF solo para revisión visual (fondo azul oscuro); los PNG son transparentes.

## Integración sugerida
Mantener las condiciones de cambio de fase del jefe actual. Al dispararse una transición, bloquear entradas duplicadas y pausar ataques durante la animación si la mecánica lo permite; al terminar, mostrar la pose/animación de la nueva fase y reanudar el combate. No modificar el progreso, la vida, el daño ni los umbrales existentes.

Canvas: `ctx.imageSmoothingEnabled = false; ctx.drawImage(atlas, frame*128, row*128, 128, 128, x-64*scale, y-113*scale, 128*scale, 128*scale);`

Verificar ancla, tamaño de dibujo, legibilidad, compatibilidad con el fondo del combate y ausencia de cambios de fase duplicados. Todavía no se ha integrado ni probado dentro del juego.

---

## Cómo se usa en el juego (v26)

- Los PNG que carga el juego están en `img/jefe/` (las 3 poses y el atlas); aquí quedan
  el manifiesto y estas notas. Los 24 cuadros sueltos y los GIF del paquete original no
  se usan en el combate y no se copiaron.
- `js/jefe-sprites.js` dibuja con `ESC = 0,7` (celda de 128 → ~90 px lógicos) y el ancla
  (64, 113) en un punto fijo del combate, 41 px bajo el centro de golpe del jefe. La
  fase 3 mide ~72×58 px y la fase 1 ~36×34 px: caben en la arena de 320×180 y en la de
  400×270 sin tapar la barra de vida (se comprueba en `scripts/regresiones.mjs`).
- Comprobado al integrar: el cuadro 0 de la fila 0 es idéntico a la pose de la fase 1, el
  11 de la fila 0 y el 0 de la fila 1 son idénticos a la fase 2, y el 11 de la fila 1 a la
  fase 3; por eso no hay saltos al empezar ni al acabar cada transformación.
- Pendiente (siguiente entrega): ataque, reposo, daño y derrota definitiva.
