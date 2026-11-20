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
| **v40.6** | — | 2026-11-16 | Reparación visual de los protagonistas: retratos dibujados a mano para cada tamaño (16, 32 y 48) con cinco gestos y parpadeo, caras del cuerpo entero repintadas para coincidir con ellos, gato nuevo, gafas de cristal transparente y reposo femenino sin salto de cabeza (`scripts/build-retratos-protagonistas.mjs`, `scripts/build-caras-cuerpo.mjs`) |
| **v40.7** | — | 2026-11-16 | Reparación de accesorios, fase 1: gafas y audífonos con anclajes propios por dirección, apariencia y cuadro de marcha (`ACC_CABEZA` en `js/sprite.js`, arcos de `scripts/calcula-arcos-cabeza.mjs`); los otros siete accesorios y los retratos no cambian |
| **v40.8** | — | 2026-11-16 | Reparación de accesorios, fase 2: gorra a medida de cada celda de los atlas (`scripts/build-accesorios-cuerpo.mjs` → `js/accesorios-cuerpo-arte.js`) y corbata que sigue el eje del pecho (`ACC_CORBATA`); iconos nuevos; los otros cinco accesorios y los retratos no cambian |
| **v40.9** | — | 2026-11-16 | Reparación de accesorios, fase 3: capa (`ACC_CAPA`: manto por detrás o por encima según la vista, hombreras y broche, vuelo en la marcha, pelo sobre la capa) y medalla (`ACC_MEDALLA`: cinta en V y disco); iconos nuevos; los otros tres accesorios y los retratos no cambian |
| **v40.10** | — | 2026-11-17 | Reparación de accesorios, fase 4: corona (`ACC_CORONA`: aro y cinco puntas giradas con la dirección sobre la cabeza de cada celda, gema delantera) y café (`ACC_CAFE`: taza sujeta por la mano de cada cuadro con vapor); iconos nuevos; solo queda el gato como accesorio sin rehacer, y los retratos no cambian |
| **v40.11** | — | 2026-11-17 | Reparación de accesorios, fase 5: el gato de oficina pasa a ser un acompañante visual independiente (`js/gato.js`, sprites de `js/gato-arte.js` generados por `scripts/build-gato.mjs`: reposo, caminata, 8 orientaciones, parpadeo y cola); camina junto al protagonista, se detiene cuando él se detiene y no interviene en colisiones ni mecánicas; icono nuevo; los retratos no cambian |
| **v40.12** | — | 2026-11-17 | Retratos, fase 6: los nueve accesorios de los retratos de 16, 32 y 48 siguen el arte nuevo del cuerpo (gafas transparentes, gorra con visera, corona con puntas y gema, capa con mantón y broche, medalla con cinta en V, taza de barro con vapor y el gato del acompañante recortado y reducido); `scripts/lib-accesorios-retrato.mjs` |
| **v40.13** | — | 2026-11-17 | Integración completa, fase 7: el retrato propio de la sala de clase (lista y podio) usa el retrato del protagonista con sus accesorios; caso de regresión «cada accesorio en cada pantalla» (2 apariencias × 9 accesorios × portada, Mi Avatar, pasillo y diálogos); herramienta `scripts/galeria-avatar.html` (galería de aceptación con el renderizador real) |
| **v40.14** | — | 2026-11-17 | Corrección visual tras la revisión externa de v40.13: ojos y boca de los retratos de 32×32 (blanco a ambos lados del iris, sin pestaña lateral, boca normal simplificada), diadema de los audífonos de perfil con una sola rama, reposo frontal con la pose de portada en Mi Avatar y tarjetas de apariencia y camisa, y el visor se repinta al detener la caminata; no toca atlas ni los demás accesorios |
| **v40.15** | — | 2026-11-17 | Ciclo de caminata de ella con el arte de su propio atlas: el cuadro 0 pasa a ser el paso del otro pie (S, SE, NE, N, NO, SO) y de frente la zancada del cuadro 3 alterna con la del 1, con la mitad de arriba intacta y la de abajo en espejo de su propia vista; café con anclaje propio en los cuatro cuadros; `scripts/build-ciclo-femenino.mjs`, `test/ciclo-femenino.test.mjs` |
| **v40.16** | — | 2026-11-17 | Movimiento de los dos protagonistas: balanceo de 1 px al caminar (cuadros 1 y 3, el del pie levantado) y respiración parado (1,2 s arriba y 1,2 s abajo). El tronco y la cabeza, con lo que lleven puesto, suben 1 px con los pies y las manos fijos, repitiendo una fila en una fila de corte por dirección (`CORTE_ALZA`, `scripts/calcula-corte-alza.mjs`); solo cambia cómo se dibuja, sin tocar atlas, colisiones, velocidad ni puntos; apagado con «reducir movimiento»; en el pasillo y en el probador de Mi Avatar; `test/alza.test.mjs` |
| **v40.17** | — | 2026-11-18 | Ritmo de la respiración parado: sube 1 s y baja 2 s (ciclo de 3 s, antes 1,2 s arriba y 1,2 s abajo); solo cambia `RESP_ARRIBA` y `RESP_ABAJO` en `js/sprite.js`; elegido entre tres ritmos comparados en video |
| **v40.18** | — | 2026-11-19 | Seguridad del código de guardado (hallazgos A1 y A8 de la auditoría de v40.17): `sanear()` deja `stats`, `mejores`, `pesos`, listas de ids, dificultad, puntos, XP y nombre en el tipo y el rango que el juego usa (un código ajeno traía texto en `stats` y `mejores` y se pintaba con `innerHTML`: inyección); `esc()` al pintar esos valores; importar pide un segundo toque y comprueba el código antes (`leerCodigo`); `test/seguridad-guardado.test.mjs` y dos regresiones de navegador; no toca precios, puntos, XP, niveles, dificultad, base de datos ni nada guardado de una partida real |
| **v40.19** | — | 2026-11-19 | Logros secretos, fase A: sección «🔒 SECRETOS» con diez tarjetas (❓ y estrellas de dificultad) y cinco logros conseguibles (S10 CÓDIGO CLÁSICO con ↑↑↓↓←→←→BA en la portada, S6 NOCTÁMBULO entre las 00:00 y las 04:59, S7 TERCO, S4 EXPEDIENTE PERFECTO, S3 SIN UN RASGUÑO en una campaña empezada con esta versión), cada uno con una camisa secreta (índices 4 a 8, `CAMISAS_SECRETAS`, `colorCamisa()`; solo persisten con su logro); `dif` en los 19 logros; cola de avisos (`mostrarAviso`); campos `campanaIniciada`, `limpio` y `fallosDia` con saneado; no toca precios, puntos, XP, niveles, dificultad, base de datos ni recompensas existentes; `test/logros-secretos-a.test.mjs`, `test/cola-avisos.test.mjs` |
| **v40.20** | — | 2026-11-19 | Pistas en los logros secretos: campo `hes`/`hen` en `LOGROS_SECRETOS`, visible desde el principio en la tarjeta bloqueada (las cinco conseguibles llevan pista críptica; las de las fases B/C dicen «Aún no disponible»); al ganarlo se sigue enseñando la condición completa. No toca lógica, precios, puntos ni guardado |
| **v40.21** | — | 2026-11-19 | Píxeles azules sueltos: `scripts/limpiar-azules-femenina.mjs` lleva a la paleta los ~660 píxeles azules fuera de paleta de la camisa femenina (atlas de caminata y de portada; solo filas 27–44 de cada cuadro) que no cambiaban con la camisa elegida; la camisa Terminal pasa de `#111820` a `#16181b` (negro neutro, sin tinte azul en el sombreado). `test/azules-camisa-femenina.test.mjs` |
| **v40.22** | — | 2026-11-20 | Renovación visual de LOGROS (piloto del usuario integrado): 30 sprites 40×40 en `img/logros/` (19 normales, 10 secretos al descubrirse y `secreto.png` como candado común), asignados por id con `iconoLogro()` en `js/records.js` (con el emoji como respaldo), fondo exclusivo `img/logros/sala-logros.webp` (`#screen:has(>.logros-pantalla)`), estilos de tarjetas e iconos, los 31 PNG/WebP en la caché de `sw.js`; hojas originales en `arte/logros*` y `scripts/build-logros-piloto.sh`. No cambia condiciones, textos, progreso ni recompensas. `test/logros-sprites.test.mjs` |
| **v40.23** | — | 2026-11-20 | Renovación visual de la TIENDA (piloto del usuario integrado sobre v40.22): fondo exclusivo `img/tienda/oficina-nocturna.webp` (`#screen:has(>.tienda-pantalla)`), cinco sprites 40×40 de las mejoras (`vida`, `tiempo`, `iman`, `doble`, `escudo`), encabezado y secciones ACCESORIOS/MEJORAS, tarjetas con cuatro estados (disponible, sin puntos, comprado, equipado) y los seis recursos en la caché de `sw.js`; los nueve accesorios siguen usando el dibujo del avatar. No cambia precios, efectos, compras, equipamiento, guardado ni logros. Fuente en `arte/tienda/`; plan en `planes/tienda-visual.md` |
| **v40.24** | — | 2026-11-20 | Renovación visual de RÉCORDS (piloto del usuario integrado sobre v40.23): fondo exclusivo `img/records/salon-de-la-fama.webp` (`#screen:has(>.records-pantalla)`), tres paneles diferenciados (marcador global, marcas locales y escalafón con ordinales), marco con desplazamiento horizontal para las tablas, estados de carga, sin conexión y sin registros con la misma jerarquía, y el fondo en la caché de `sw.js`. No cambia puntuaciones, rangos, filtros, consultas a RANKING, grupos ni datos guardados. Plan en `planes/records-visual.md` |

La v11 vieja no existió: se pasó de la v10 a la v12.

Hasta la v44 vieja (v21.2): 21 versiones grandes y 22 de arreglos. De la v21.3
en adelante ya solo existe el número nuevo (— en la columna del viejo).
