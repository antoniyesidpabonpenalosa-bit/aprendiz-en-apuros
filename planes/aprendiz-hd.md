# Plan: arte nuevo del aprendiz (v33)

> Estado: **hecho (v33)**. Paquete del autor sobre la v26.1. `aprendiz-hd.patch` (`js/sprite.js`,
> `sw.js`, `test/sprite.test.mjs`) **aplicó limpio**; la portada se adaptó a mano porque el paso 3
> (v29) pintaba el parpadeo y el brazo del saludo con rectángulos sobre el arte antiguo.

## Qué cambia

- `APRENDIZ.dibujar` usa el atlas nuevo para el jugador en todos los sitios donde ya se usaba:
  portada, pasillo, mapa (`aprendizMapa`), runner y jefe. Mismas firmas, mismo tamaño de cuadro,
  mismas direcciones y el pie en el mismo sitio: colisiones, velocidad y controles no cambian.
- Los cuatro personajes del pasillo (colores hex) siguen con el atlas clásico.
- Si el atlas nuevo no carga, el jugador usa el clásico; si tampoco, el dibujo de respaldo de
  siempre.
- Portada: `aprendizPortada` dibuja la pose de `APRENDIZ.dibujarPortada` (0 reposo, 1 parpadeo,
  2-3 saludo) en vez de pintar ojos y brazo encima. Se conservan la respiración (solo la mitad de
  arriba, pies fijos), los tiempos (`portadaEstado`), el saludo al puntero/foco/toque, el
  redibujado solo cuando algo cambia, la limpieza al salir y el movimiento reducido. Si el
  atlas de poses no carga, sale la pose de reposo.
- `sw.js` guarda los dos PNG nuevos para jugar sin conexión.

## Qué no cambia

Colisiones, velocidad, controles, progreso, accesorios, Mi Avatar (retratos) ni datos guardados.
