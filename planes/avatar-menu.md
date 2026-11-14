# Plan: la ficha de jugador de la portada (paso 5 del rediseño de la portada)

> Estado: **hecho (v31)**. Paquete del autor (parche sobre la v26.1 + paso 4). El parche
> `avatar-portada.patch` **aplicó limpio** sobre la rama del paso 4 (v30), sin integración a mano.

## Qué cambia

La tarjeta Mi Avatar (`#t-perso`) pasa a ser una ficha RPG:

- Retrato en un marco verde con esquinas doradas. El lienzo `#t-av` tiene ahora la resolución
  nativa del retrato (16×16, o 32×32 con el detalle fino `S.av32`); antes era 24×24 y el
  dibujo de 16 quedaba a 1,5 px por píxel.
- Nombre del jugador (`esc(S.nombre)`, o «TÚ / YOU» si no tiene) y rango (`rangoNom()`).
- XP (`S.xp` / siguiente rango de `progresoXp()`; en el rango máximo, solo la XP).
- Estrellas (`totalStars()` de `TOT_DIAS × 3`).
- Campaña: días superados (`progreso()` / `TOT_DIAS`) y su porcentaje, con el criterio de
  siempre (días consecutivos superados, no la XP).

## Qué no cambia

- Sigue siendo un solo botón (`#t-perso`) que abre `rPerso()`; sin botones anidados.
- El retrato sigue saliendo de `retratoVivo(av, CARAS.yo(true))`: piel, camisa, accesorio y
  parpadeo (quieto con «reducir movimiento»).
- La pantalla de personalización, el guardado, los precios, los accesorios y Supabase.
- CSS acotado a `.portada`; sin imágenes, fuentes ni recursos nuevos (solo cambia `CACHE`).

## Siguiente

Paso 6: transiciones y efectos de selección.
