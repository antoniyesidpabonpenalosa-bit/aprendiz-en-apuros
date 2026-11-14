# Versiones de Aprendiz en apuros

## La regla

- **Número grande** (`v21` → `v22`): sale algo **nuevo** para jugar o ver (un
  modo, un minijuego, los retratos, el pasillo…).
- **Número pequeño** (`v21.1`, `v21.2`…): **arreglos** y cambios pequeños.

Cómo se publica una versión: ver «Cómo se publica una versión» en el
[README](README.md).

## Por qué hay dos numeraciones

Hasta noviembre de 2026 cada publicación subía el número en uno, fuera una
novedad grande o un arreglo de una línea, y se llegó a la **v44**. Entonces se
renumeró todo con la regla de arriba: la v44 pasó a ser la **v21.2**.

El juego, las novedades y la caché usan ya los números nuevos, pero **los
mensajes de commit y los comentarios antiguos conservan los viejos** (git no
deja cambiarlos). Esta tabla es la equivalencia.

## Equivalencia (de la más vieja a la más nueva)

| Número nuevo | Número viejo | Fecha | Qué trajo |
|---|---|---|---|
| **v1** | v1 | 2026-07-04 | Lanzamiento: modo HD/OLED, minijuegos Code Review y Merge Conflict, PWA |
| **v2** | v2 | 2026-07-04 | Jefe final, mando y giroscopio |
| v2.1 | v3 | 2026-07-04 | Casilla ??? para repetir el jefe y un arreglo |
| **v3** | v4 | 2026-07-04 | Dificultad, jefe con fases, estadísticas y combos |
| **v4** | v5 | 2026-07-11 | Vista previa al compartir, código de guardado, sonido en 3 estados |
| **v5** | v6 | 2026-07-12 | Temporada 2 "El Contrato": días 11-15 y tienda ampliada |
| v5.1 | v7 | 2026-09-02 | Arreglo: HTML sin ids repetidos |
| **v6** | v8 | 2026-09-10 | Marcador global de récords |
| **v7** | v9 | 2026-09-16 | Reto diario con marcador y premios por racha |
| **v8** | v10 | 2026-09-17 | Accesibilidad por teclado, pistas en los logros, marcador desde el día 5 |
| v8.1 | v12 | 2026-09-17 | Arreglos de accesibilidad (WCAG), PWA en iOS y fuentes propias |
| v8.2 | v13 | 2026-09-17 | Arreglo: etiquetas de los menús |
| **v9** | v14 | 2026-09-18 | Ayuda de controles, repaso espaciado, texto legible y aula |
| v9.1 | v15 | 2026-09-21 | Arreglo: etiquetas del menú con su icono |
| **v10** | v16 | 2026-09-21 | Modo libre y modo sin fin |
| **v11** | v17 | 2026-09-21 | Pantalla de avatar como ficha de personaje |
| v11.1 | v18 | 2026-09-21 | El sin fin compite en el marcador del aula |
| v11.2 | v19 | 2026-09-22 | Detalle del retrato 16 o 32 |
| v11.3 | v20 | 2026-09-22 | El marcador ya no se congela y la carga no espera a una red lenta |
| **v12** | v21 | 2026-09-23 | Animación pixel: los retratos parpadean y el runner corre |
| v12.1 | v22 | 2026-09-23 | Comprobación de tipos del código (invisible para el jugador) |
| **v13** | v23 | 2026-09-23 | Salas de clase |
| v13.1 | v24 | 2026-09-24 | Arreglo: el nombre del jugador es obligatorio |
| **v14** | v25 | 2026-09-24 | El aprendiz de cuerpo entero en el mapa y el jefe |
| **v15** | v26 | 2026-09-25 | Consola de laboratorio |
| **v16** | v27 | 2026-09-30 | Aviso de versión nueva y pantalla de novedades |
| v16.1 | v28 | 2026-09-30 | Arreglo: el cuestionario del día 5 en dificultad Práctica |
| v16.2 | v29 | 2026-09-30 | Arreglo del runner |
| v16.3 | v30 | 2026-10-01 | Arreglos de la revisión (vuelta 1) |
| v16.4 | v31 | 2026-10-01 | Arreglo: controles pegados en el jefe y el runner |
| v16.5 | v32 | 2026-10-02 | Arreglo: consola, pausa e idioma |
| v16.6 | v33 | 2026-10-02 | Arreglo: doble toque en la tienda y récords dañados |
| v16.7 | v34 | 2026-10-02 | Arreglo: el runner de los modos sueltos lanzaba al jefe |
| v16.8 | v35 | 2026-10-02 | Arreglo: las mejoras no dan ventaja en una sala |
| v16.9 | v36 | 2026-10-02 | Arreglo: partidas guardadas con datos raros |
| v16.10 | v37 | 2026-10-02 | Arreglo: foco de teclado y reducir movimiento |
| **v17** | v38 | 2026-10-02 | Jefe final en arena grande, estilo hacker |
| **v18** | v39 | 2026-10-05 | Modo Repaso |
| **v19** | v40 | 2026-10-05 | Salas en vivo y panel del instructor |
| **v20** | v41 | 2026-11-06 | Efectos: chispas, ondas, confeti, congelado del golpe, cortina de pixeles, fuegos |
| **v21** | v42 | 2026-11-09 | Retratos dibujados y caminata del aprendiz |
| v21.1 | v43 | 2026-11-09 | Arreglo: tras publicar, carga la versión nueva al primer intento |
| v21.2 | v44 | 2026-11-09 | Los personajes de la historia siempre dibujados |
| v21.3 | — | 2026-11-09 | El juego pasa a llamarse "Aprendiz en apuros", sin número |
| v21.4 | — | 2026-11-09 | El runner usa el sprite del aprendiz; "¡PERFECTO!" no tapa el título; "aprendiz" en los minijuegos |
| v21.5 | — | 2026-11-10 | Rangos recalibrados: DEV SENIOR ya no se alcanza en el día 4 |
| **v22** | — | 2026-11-10 | El pasillo: el mapa de la campaña con 3 zonas y 15 puertas (la lista de días sigue disponible) |
| v22.1 | — | 2026-11-10 | Arreglo: el cartel de versión nueva ya no sale en la primera visita |
| v22.2 | — | 2026-11-11 | Pasillo: el aprendiz espera en la puerta del día que toca, tocar otra vez la puerta entra, y el icono del minijuego en el letrero |
| **v23** | — | 2026-11-12 | Tres efectos de pixel art de pixelfx: el corazón que se rompe, «NUEVO RANGO!» y «xN RACHA» |
| **v24** | — | 2026-11-13 | Personajes con nombre en el pasillo (Gustavo, Valentina, Andrés y Don Jairo, el vigilante): consejos de puerta, de tema flojo y generales |
| v24.1 | — | 2026-11-13 | Repetir un día ya superado paga la cuarta parte de puntos y XP (antes, completo) |
| v24.2 | — | 2026-11-13 | Jefe, fase 3: sin el abanico de ❌, rayo más seguido (cada 2 s) y jefe más lento (2,45 → 2,0) |
| **v26** | — | 2026-11-14 | El jefe evolutivo: tres apariencias (Bug morado, Caos naranja, Error Fatal rojo) y dos transformaciones animadas de 12 cuadros que detienen el combate (`js/jefe-sprites.js`, `img/jefe/`); sin conexión incluido. El número 25 está reservado para los iconos pixel, que aún no se publican |

La v11 vieja no existió: se pasó de la v10 a la v12.

Hasta la v44 vieja (v21.2): 21 versiones grandes y 22 de arreglos. De la v21.3
en adelante ya solo existe el número nuevo (— en la columna del viejo).
