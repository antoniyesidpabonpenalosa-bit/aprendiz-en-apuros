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
| **v25** | — | 2026-11-14 | Iconos de pixel art propios (`js/iconos.js`) en lugar de emojis: los 15 días, dificultades, candado, sonido, menú principal y tipos de minijuego; el jefe con un dibujo por fase; las ❌ y los obstáculos del runner en pixel |
| **v26** | — | 2026-11-14 | El jefe evolutivo: tres apariencias (Bug morado, Caos naranja, Error Fatal rojo) y dos transformaciones animadas de 12 cuadros que detienen el combate (`js/jefe-sprites.js`, `img/jefe/`); sin conexión incluido. |
| v26.1 | — | 2026-11-14 | El jefe final se llama EL ERROR EVOLUTIVO (antes EL BUG FINAL) en el mapa, la historia y el botón de repetir; en inglés, THE EVOLVING ERROR |
| **v27** | — | 2026-11-14 | Fondo nuevo del menú principal: ciudad nocturna animada en pixel art (`js/fondo.js`, `img/fondo/`); solo en la portada, las montañas siguen en el resto y de respaldo |
| **v28** | — | 2026-11-14 | Título nuevo de la portada: dibujo en pixel art (`img/titulo/`) con el `<h1>` de texto como respaldo accesible; el modo HD conserva su título de texto |
| **v29** | — | 2026-11-14 | El aprendiz de cuerpo entero junto a JUGAR en la portada: respira, parpadea, saluda y reacciona al puntero, al foco y al toque, con la piel y la camisa del jugador |
| **v30** | — | 2026-11-14 | Botones e iconos de la portada con relieve (paso 4 del rediseño): tarjetas, modos en violeta, dificultad en dorado, JUGAR verde y reto morado; CSS acotado a `.portada` |
| **v31** | — | 2026-11-14 | Ficha de jugador estilo RPG en la tarjeta Mi Avatar de la portada (paso 5 del rediseño): retrato a resolución nativa, nombre, rango, XP, estrellas y días de campaña; CSS acotado a `.portada` |
| **v32** | — | 2026-11-14 | Transiciones y efectos de selección de la portada (paso 6 y último del rediseño): entrada suave, chispas y onda en JUGAR, confirmación dorada de la dificultad, chispas en los demás botones y microanimaciones de iconos, con el motor FX de siempre |
| **v33** | — | 2026-11-14 | Arte nuevo del aprendiz (`img/aprendiz-caminar-hd.png`, `img/aprendiz-portada-hd.png`) en portada, pasillo, mapa, runner y jefe; poses dibujadas de parpadeo y saludo en la portada; el atlas clásico queda de respaldo y para los personajes del pasillo |
| **v34** | — | 2026-11-14 | 15 iconos de 32×32 para la portada (`pxiPortada`, PNG incrustados en `js/iconos.js`); el resto del juego sigue con `pxi()` |
| **v35** | — | 2026-11-14 | Barras RPG (`barraRpg`): XP de 10 casillas con el rango siguiente, campaña de 15 (una por día) con borde dorado al 100 %, barra compacta en el HUD de la portada y animación de ganancia en el resultado; mismos cálculos de XP y progreso |
| **v36** | — | 2026-11-14 | Campus nocturno HD de fondo en la portada (`img/portada/`: escenario WebP y 5 capas animadas de 1600×900, velo para la legibilidad); sustituye a la ciudad de la v27, que se retira (imágenes, CSS y caché) |
| **v37** | — | 2026-11-14 | Pasillo HD: techo, muro y suelo por ambiente (formación cálida, empresa fría) y puertas de pixel art cuya hoja gira al entrar (`img/pasillo-hd/`); el pasillo de CSS queda de respaldo |
| **v38** | — | 2026-11-14 | Sprites propios de cuerpo entero para los 4 personajes del pasillo (`img/npc/pasillo.png`, `js/npc-sprites.js`); el cuerpo del aprendiz recoloreado queda de respaldo |
| **v39** | — | 2026-11-14 | Diálogos cinematográficos (`js/cinematica.js`, `img/cine/`): retrato grande, fondo del lugar, narrador, texto animado, continuar/saltar y páginas con hablante y gesto; los textos de la historia no cambian |
| **v40** | — | 2026-11-15 | Primera fase de identidad: apariencia masculina/femenina guardada, atlas femenino y visor de cuerpo entero en Mi Avatar, con giro y caminata de prueba |
| **v40.1** | — | 2026-11-15 | Identidad, parte 2: atlas masculino premium (`img/aprendiz-masculino-premium-*.png`) con cabello, ojos, cuello, cinturón, botas y saludo articulado; el HD anterior queda de respaldo |
| **v40.2** | — | 2026-11-15 | Identidad, parte 3: retratos de los dos protagonistas en 16×16 y 32×32 y cinco expresiones de cine con parpadeo (`js/retratos-aprendiz*.js`), recoloreables y con los 9 accesorios; la historia no cambia |
| **v40.3** | — | 2026-11-15 | Identidad, parte 4: tarjetas de piel (retrato) y camisa (cuerpo entero) en Mi Avatar con nombre del color, selección dorada y guardado al instante; las paletas no cambian |
| **v40.4** | — | 2026-11-15 | Identidad, parte 5: los 9 accesorios en pixel art sobre el cuerpo entero (`ACC_ARTE`, 8 direcciones y 4 pasos, los dos protagonistas) y probador gratis en Mi Avatar con EQUIPAR / COMPRAR Y EQUIPAR; precios e inventario no cambian |
| **v40.5** | — | 2026-11-15 | Identidad, parte 6: Mi Avatar definitivo (vestidor): vistas ambos/retrato/cuerpo, giro en los dos sentidos con la dirección, selectores rápidos de piel y camisa, atajo al probador y colección; sin cambios de precios ni de guardado |

La v11 vieja no existió: se pasó de la v10 a la v12.

Hasta la v44 vieja (v21.2): 21 versiones grandes y 22 de arreglos. De la v21.3
en adelante ya solo existe el número nuevo (— en la columna del viejo).
