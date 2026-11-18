# Plan: identidad y personalización (v40 a v40.12)

> Estado: **hecho (v40 a v40.5), las seis partes**. Paquete del autor sobre la v39 (`identidad-v40.patch`):
> aplicó limpio. Se añadieron 8 casos al barrido del navegador y se regeneró el design system.

## Qué hay

- `S.apariencia`: `masculina` (por defecto, también para partidas viejas o valores raros) o
  `femenina`. Solo cambia el dibujo; viaja en `pa3` y en el código de exportar/importar.
- Mi Avatar abre en la pestaña APARIENCIA: dos tarjetas con `aria-pressed`, retrato y cuerpo
  entero a la vez, GIRAR (8 direcciones) y CAMINAR (desactivado con «reducir movimiento»).
- `APRENDIZ.dibujar()` y `dibujarPortada()` eligen el atlas según la apariencia, así que la
  aprendiz sale en la portada, el mapa, el pasillo, el runner y el jefe sin tocar esas pantallas.
  Los NPC siguen con su sprite propio (o el clásico con colores hex).
- Atlas femeninos: `img/aprendiz-femenina-caminar.png` (176×592, filas S, SE, E, NE, N, NW, W,
  SW) y `img/aprendiz-femenina-portada.png` (176×74: reposo, parpadeo, transición, saludo). El
  recoloreo usa paletas exactas de camisa y piel; pelo y pantalón no cambian.
- Retrato 16×16 y 32×32 con peinado femenino; los accesorios siguen igual.
- Comprar un accesorio con una confirmación vieja ya no cobra dos veces.

## Parte 2 (v40.1): masculino premium

- `img/aprendiz-masculino-premium-caminar.png` (176×592) y `-portada.png` (176×74: reposo,
  parpadeo, saludo A y B), refinados desde los HD de v33 con `scripts/build-aprendiz-masculino.py`
  (Pillow); contrato en `arte/aprendiz-masculino-premium/`.
- `APRENDIZ` prefiere el premium para el jugador masculino; si no carga, el HD anterior y luego el
  clásico. Misma paleta exacta de piel y camisa que el femenino. Paquete aplicado limpio; se
  arregló la fila de VERSIONES.md (estaba fuera de la tabla) y se añadió un caso al barrido.

## Parte 3 (v40.2): retratos de los protagonistas

- `js/retratos-aprendiz-arte.js` (datos RLE generados por `scripts/build-retratos-protagonistas.py`,
  fuentes en `arte/retratos-protagonistas/`) y `js/retratos-aprendiz.js`: retrato del jugador en
  16×16, 32×32 y busto de cine 48×48 (en un lienzo de 96) con 5 gestos y parpadeo, recoloreo de
  piel y camisa y los 9 accesorios.
- `CARAS.yo()` lleva `protagonista:true`; `retrato()` lo dibuja con el módulo nuevo y los demás
  siguen con `cara`/`cara32`. `CINE.montar()` le pasa el gesto: una página futura
  `{quien:'APRENDIZ',gesto:'preocupado',t:'…'}` lo enseña. Ninguna escena actual cambia de cara
  (comprobado en el barrido).
- Arreglo al integrar: a 16×16 las gafas y los audífonos reducidos desde 48 tapaban los ojos con
  una franja negra; ahora se pintan con píxeles propios de 16.

## Parte 4 (v40.3): tarjetas de piel y camisa

- `peTarjetasColor()` en `js/tienda.js`: 4 tarjetas de piel con el retrato real (32×32) y 4 de
  camisa con el cuerpo entero de la apariencia actual, nombre del color en ES/EN, muestra,
  selección dorada con ✓ y estado EQUIPADO/ELEGIR, `aria-pressed`. Elegir guarda al instante y
  no vuelve a guardar si ya estaba. Se repintan al cambiar apariencia o color y al cargar atlas.
- Mismas paletas `SKINS`/`CAMISAS` e índices; ni compras ni accesorios cambian. Paquete aplicado
  limpio (salvo la fila de VERSIONES.md); dos casos nuevos en el barrido.

## Parte 5 (v40.4): accesorios sobre el cuerpo y probador

- `ACC_ARTE` (js/sprite.js): los 9 accesorios en pixel art dibujados sobre el cuadro del jugador
  (8 direcciones, 4 pasos, las dos apariencias); `APRENDIZ.dibujar/dibujarPortada` reciben `acc`
  (por defecto `S.acc`), así salen en portada, mapa, pasillo, runner y jefe. Los NPC no los
  llevan; el ancla, la caja de choque y la velocidad no cambian.
- Mi Avatar: tocar un accesorio solo lo PRUEBA (no toca `S` ni el guardado); EQUIPAR o COMPRAR Y
  EQUIPAR lo confirman. Cancelar o cambiar de pestaña descartan la prueba. Un solo accesorio.
- Tienda: iconos pixel y botón PROBAR ACCESORIOS; su compra directa no cambia. Precios iguales.
- Al integrar: la prueba del barrido de la ficha de la portada (v31) equipaba con un toque; ahora
  toca y confirma. Seis casos nuevos. La campaña de 15 días jugada por el robot con un accesorio
  distinto cada día y las dos apariencias termina sin errores y sin cambiar accesorio ni inventario.

## Parte 6 (v40.5): Mi Avatar definitivo

- Vestidor en `rPerso()`: vistas ambos/retrato/cuerpo (solo en memoria, `peVista`), giro en los
  dos sentidos con el nombre de la dirección, caminar, detalle 16/32; selectores rápidos de piel
  y camisa que pulsan las mismas tarjetas; atajo al probador; colección con barra; el HUD se
  refresca al comprar. Sin campos nuevos en el guardado.
- Comprobado al integrar las seis partes: barrido completo, caché real del service worker sin
  red (`pa4-v40.5`) y migración de una partida de v39. Cuatro casos nuevos en el barrido; uno de
  v40.1 ajustado (las gafas de v40.4 tapan el parpadeo de la portada).

## Retoques al integrar (v40.5, pedidos por el autor)

- La gorra del retrato del protagonista usa los azules de la del cuerpo y la tienda (antes verde).
  El dibujo antiguo de `cara`/`cara32` sigue verde: es también la gorra del vigilante.
- A 16×16, el ojo izquierdo de la aprendiz quedaba pegado a la sombra del flequillo; ahora tiene
  piel a los dos lados.

## Reparación visual (v40.6)

Paquete `reparacion_visual_avatar` del autor: los retratos tenían ojos, boca y barba mal, no coincidían con el cuerpo
y no eran dibujos propios de cada tamaño (se recortaba el atlas del cuerpo y se reducía). Lo que se hizo:

- **Retratos nuevos** (`scripts/build-retratos-protagonistas.mjs`, sin dependencias): las formas grandes salen de los
  mismos polígonos rasterizados a cada tamaño y los rasgos (ojos, cejas, nariz, boca) están dibujados a mano para cada
  tamaño y gesto; a 16×16 la cabeza entera es un mapa propio. Nuevo esquema de datos (`frames[apariencia][tamaño][gesto]`,
  `acc[accesorio][apariencia][tamaño]`); `RETRATOS_APRENDIZ.dibujar` y sus consumidores no cambian. Se quitó la
  sobrescritura genérica de ojos a 16.
- **Caras del cuerpo** (`scripts/build-caras-cuerpo.mjs`, idempotente): masculino con barba completa, cejas y ojos del
  retrato en S, SE, E, W y SW y en las 4 poses de portada (la cabeza es idéntica en los 4 cuadros). Solo se repinta el
  interior de la cara: silueta, pelo, pies, anclaje y los 16 colores no cambian.
- **Femenina, sin salto de cabeza:** la columna de reposo era otro dibujo (cabeza más pequeña) que las de caminata. El
  reposo pasa a ser la pose de «paso» (columna 2), así el ciclo es paso, zancada A, paso, zancada B. Consecuencia: parada,
  ella ya no está perfectamente recta y de frente, sino en mitad de un paso. **Pendiente de la aprobación del autor.**
- **Gato** nuevo (frente y espalda, con cola) en cuerpo, retrato (3 tamaños) e icono; **gafas** de cristal transparente
  alineadas con los ojos de cada personaje; los 9 accesorios comparten colores entre cuerpo y retrato (lo comprueba una prueba).
- Expresión neutra en Mi Avatar (`01-expresion-neutra.patch`).

## Reparación de accesorios, fase 1: gafas y audífonos (v40.7)

Paquete `reparacion_accesorios_fase1`: las gafas y los audífonos se dibujaban con una pieza frontal y desplazamientos casi
fijos para todas las direcciones. Ahora hay un módulo propio, `ACC_CABEZA` (js/sprite.js), con anclajes por dirección
(S, SE, E, NE, N, NO, O, SO), apariencia, cuadro de marcha y pose de portada. Sin volteo de arte.

- **Gafas:** dos lentes de frente y en diagonal, una en perfil y ninguna de espaldas; marco con cristal translúcido (se ven
  los ojos y la expresión); patillas hacia la oreja. Las lentes masculinas están medidas sobre los ojos reales del atlas v40.6
  (una prueba comprueba que ningún ojo queda fuera de una lente).
- **Audífonos:** una copa en perfil y diagonales (la lejana no se dibuja), dos de frente y de espalda; diadema en semielipse
  hasta la cabeza (`scripts/calcula-arcos-cabeza.mjs` calcula los arcos; las copas están medidas a mano).
- **Reconciliación con v40.6:** los atlas ya no coinciden con `SHA256-BASE.txt` del paquete (v40.5): se repintaron los dos
  masculinos y el de caminata femenino. Las lentes masculinas se recalibraron y la femenina usa los mismos anclajes en el cuadro 0
  (reposo) que en el 2, porque son la misma pose. Los atlas clásico/HD de respaldo conservan el dibujo antiguo.
- No cambian: los otros siete accesorios, los retratos, precios, inventario, progreso, colisiones ni velocidad.

## Reparación de accesorios, fase 2: gorra y corbata (v40.8)

Misma línea que la fase 1, sin paquete del autor: el diseño sale de las silueta reales de los atlas v40.6.

- **Gorra:** la copa no es una pieza suelta, se calcula de la silueta de la cabeza de cada celda (8 direcciones; 1 cuadro él, 3
  cuadros ella; 4 poses de portada por apariencia) con `scripts/build-accesorios-cuerpo.mjs` → `js/accesorios-cuerpo-arte.js`
  (generado, la prueba comprueba que coincide). Domo redondeado, luz arriba a la izquierda, costuras en arco y botón; la visera
  es de frente (3 filas más sombra sobre la frente), 3/4 y perfil (cada una con su forma), solo se ve la punta en las diagonales
  de espaldas y no se ve de espaldas (banda trasera con correa). Nunca tapa los ojos (una prueba lo comprueba en el atlas masculino).
- **Corbata:** `ACC_CORBATA` en `js/sprite.js` con [eje, nudo, inclinación, largo] por dirección y cuadro: completa de frente,
  acortada e inclinada hacia donde mira en 3/4, banda estrecha en el frente del pecho en perfil y nada de espaldas. El largo de la
  portada femenina es menor (torso del reposo antiguo).
- Iconos de la tienda de los dos artículos con el arte nuevo. Los atlas clásico/HD de respaldo conservan el dibujo antiguo.
- No cambian: audífonos y gafas (fase 1), medalla, capa, café, gato, corona, retratos, precios, inventario, progreso, colisiones.

## Reparación de accesorios, fase 3: capa y medalla (v40.9)

Mismo método que las fases anteriores: anclajes por dirección y cuadro sobre los atlas v40.6, sin volteo de arte.

- **Capa** (`ACC_CAPA`, js/sprite.js): el manto cuelga por detrás del cuerpo en las vistas de frente, perfil y 3/4 (se ve por los
  lados y entre las piernas, con el forro más oscuro) y se dibuja por encima de la espalda en NE, N y NO; pliegues, borde ondulado
  y vuelo distinto en cada paso de la marcha. De frente, 3/4 y perfil hay hombreras y un broche dorado sobre el pecho (siguen el eje
  de `ACC_CORBATA`). El pelo que cae sobre la espalda (la cola de caballo) se vuelve a pintar por encima de la capa
  (`ACC_CAPA.pelo`: píxeles de pelo de la imagen base, sin tocar piel ni camisa).
- **Medalla** (`ACC_MEDALLA`): cinta en V (azul y roja) al cuello y disco dorado con relieve; de frente, estrecha en 3/4 y una tira
  de perfil; no se dibuja de espaldas.
- `ACC_ARTE.detras` recibe ahora la apariencia, la pose y si el atlas está calibrado. Iconos de la tienda con el arte nuevo; los
  atlas clásico/HD de respaldo conservan el dibujo antiguo.
- No cambian: gafas, audífonos, gorra, corbata (fases 1 y 2), café, gato, corona, retratos, precios, inventario, progreso,
  colisiones ni velocidad.

## Reparación de accesorios, fase 4: corona y café (v40.10)

- **Corona** (`ACC_CORONA`, js/sprite.js): un aro elíptico (arco cercano de cuatro filas con contorno y perlas, arco lejano fino) de la
  anchura de la cabeza a la altura de la frente, con cinco puntas triangulares repartidas a 72° y giradas con la dirección: las cercanas
  salen del arco cercano y las lejanas asoman por encima, y la gema delantera solo aparece cuando el frente mira al espectador (S, SE,
  SO). Centro y radio por celda en `ACC_CORONA.T`, que calcula `scripts/calcula-corona.mjs` sobre los atlas (una prueba comprueba que
  coincide). Queda sobre las cejas y no tapa los ojos.
- **Café** (`ACC_CAFE`): una taza de 11×10 con el asa abierta, dibujada por encima del cuerpo y con el asa sobre el puño de la celda. La mano
  (píxeles de piel de la rampa exacta bajo la cintura) sale de `scripts/calcula-cafe.mjs` (`ACC_CAFE.T`, también comprobada): la más a
  la derecha en S, SE, E, NE y N y la más a la izquierda en NO, O y SO; la taza queda del lado al que mira. Sube y baja con la mano en la
  marcha y el vapor cambia con el paso.
- Iconos de la tienda con el arte nuevo. Los atlas clásico/HD de respaldo conservan el dibujo antiguo.
- Con esto los ocho accesorios con arte corporal propio quedan rehechos; el gato (acompañante independiente) y los retratos son las
  siguientes fases. No cambian: precios, inventario, progreso, colisiones ni velocidad.

## Reparación de accesorios, fase 5: el gato de oficina como acompañante (v40.11)

- **Sprites propios** (`scripts/build-gato.mjs` → `js/gato-arte.js`, generado y comprobado): el gato se construye con partes en 3D (cuerpo, pecho,
  cabeza, hocico, orejas, patas, cola) y se proyecta desde la cámara del juego en las 8 orientaciones, así que cada vista tiene su luz, su cara
  solo cuando se ve y su cola del lado que toca (no hay volteo de arte). Estados: reposo (sentado, cuatro posiciones de la cola, con y sin
  parpadeo) y caminata (4 cuadros).
- **Comportamiento** (`js/gato.js`, `GATO`): una posición propia junto al protagonista (detrás de él cuando camina de lado, a su lado de frente
  o de espaldas) a la que llega con un pequeño retraso; camina mientras se mueve (o corre en el sitio si él corre en el sitio, como en el runner),
  mira hacia donde va, se sienta cuando se detiene y entonces mueve la cola y parpadea. Con «reducir movimiento» se queda sentado y quieto.
- **Solo visual**: no entra en colisiones, velocidades, daño, puntos ni compras (una prueba comprueba que no toca el estado del juego ni usa esas
  piezas). Ya no se pinta sobre el cuerpo del aprendiz (`ACC_ARTE.encima` no lo dibuja).
- **Dónde está**: lienzos del juego con `GATO.acompanar` (runner, jefe) y lienzo propio con `GATO.montar` en la página (pasillo, portada, mapa y
  vestidor de Mi Avatar; en el vestidor sigue al que se está probando y al girar y andar se recoloca y camina). Las tarjetas de apariencia y color
  de la tienda no llevan gato. Icono de la tienda con el sprite nuevo.
- Pendiente de la fase de retratos: el retrato del gato a 16, 32 y 48 sigue con el dibujo anterior.
- No cambian: precio (1500), compra, inventario, progreso, colisiones ni velocidad.

## Retratos, fase 6: los accesorios del retrato al día con el cuerpo (v40.12)

Los retratos de 16, 32 y 48 (el de 48 es el cinematográfico) siguen siendo dibujos propios de cada tamaño, pero sus accesorios se habían quedado con
el arte anterior. Ahora siguen el del cuerpo (`scripts/lib-accesorios-retrato.mjs`; el arte lo regenera `scripts/build-retratos-protagonistas.mjs`):

- **Gafas:** marco fino con el cristal transparente que rodea cada ojo del retrato de su tamaño (a 32 y 16 el marco es claro para que los ojos oscuros no
  se fundan con él).
- **Gorra:** copa con luz, costuras en arco y botón, visera con cara de arriba y de abajo; sube a 32 y 16 para no tapar las cejas.
- **Corona:** aro de cuatro filas con perlas, cinco puntas triangulares y gema delantera. **Capa:** alas por detrás, mantón sobre los hombros y broche.
  **Medalla:** cinta en V (azul y roja) y disco con emblema. **Café:** la taza de barro con asa abierta y vapor.
- **Gato:** el mismo sprite del acompañante (reposo de frente, `scripts/build-gato.mjs`): entero a 48, reducido por votación de color a 32 y una cabecita
  dibujada a mano a 16, para que se reconozca como el gato y no como una mancha.
- Audífonos y corbata conservan su dibujo. No cambian: la historia, los diálogos, los precios ni las mecánicas.

## Integración completa, fase 7: el mismo aprendiz en todas las pantallas (v40.13)

Revisión de cada lugar donde aparece el protagonista o un accesorio, con las dos apariencias y los nueve accesorios (capturas de escritorio y móvil, 8 pantallas):

- **Portada, Mi Avatar, tienda, pasillo, runner, jefe, diálogos, certificados:** ya usan el renderizador común (`APRENDIZ.dibujar`, `APRENDIZ.dibujarPortada`, `retrato()` y `GATO`); sin cambios de dibujo. El gato es un lienzo propio en las pantallas con DOM y se pinta aparte en los lienzos del juego.
- **Sala de clase:** el retrato propio de la lista y del podio usaba el dibujo antiguo (pelo fijo, accesorio plano). Ahora `SALA.caraDe(j, yo)` devuelve `CARAS.yo(true)` cuando la fila es la tuya, con tus accesorios nuevos.
- **Prueba nueva:** «integración · los 9 accesorios…» recorre 2 apariencias × 9 accesorios × portada, Mi Avatar, pasillo y diálogos y comprueba que el cuerpo y el retrato cambian (el gato, su lienzo propio) sin errores.
- **Herramienta:** `scripts/galeria-avatar.html` (se abre con un servidor local) pinta con el renderizador real las 8 orientaciones × 4 cuadros, los 9 accesorios, las 16 combinaciones de piel y camisa, los retratos a 16/32/48 con 5 expresiones y el gato. No forma parte del juego ni de la caché.
- **Límite conocido:** el servidor de la sala no guarda la apariencia, así que los demás jugadores se ven con el dibujo de siempre; mostrarla exige un cambio en la base de datos, que no se hace sin confirmación expresa.

## Corrección visual tras la revisión externa (v40.14)

Una revisión independiente de v40.13 (parche aplicado tal cual, con comparativas del renderizador real) corrigió cinco cosas puntuales, sin tocar los atlas ni los demás accesorios:

- **Retratos de 32×32:** los mapas de ojos normal, feliz, enojado y preocupado llevan blanco a ambos lados del iris; se retira la pestaña lateral de la versión femenina y se simplifica la boca normal. El arte se regenera siempre con `scripts/build-retratos-protagonistas.mjs`, nunca a mano.
- **Audífonos de perfil (E/O):** el arco conserva solo la rama visible desde la copa hasta la parte superior; antes se dibujaba una segunda varilla falsa sobre el pelo. Las otras seis direcciones y las poses de portada no cambian.
- **Reposo frontal:** en Mi Avatar y en las tarjetas de apariencia y camisa, el personaje quieto de frente usa la pose de portada (`peDibujaCuerpo`) y no el cuadro 0 de marcha, que en la aprendiz dejaba una pierna levantada. La clave de repintado incluye el estado de movimiento, así que al detener la caminata el visor vuelve al reposo.
- **Pendiente, a propósito:** las otras siete direcciones quietas siguen usando el cuadro 0 de marcha (hace falta un atlas de reposo de 8 direcciones). La pose de portada y la de marcha son dibujos distintos y se nota el cambio al empezar a andar. Lo del ciclo femenino (cuadros 0 y 2 iguales) se resolvió en v40.15.

## Ciclo de caminata de ella (v40.15)

Desde v40.6 el cuadro 0 de su atlas era una copia del 2 (la pose de paso), así que el ciclo repetía el mismo paso con el mismo pie levantado, y de frente (S) las dos zancadas levantaban también el mismo pie: ella «cojeaba». Sin IA y con el arte del propio atlas (`scripts/build-ciclo-femenino.mjs`, idempotente, corre después de `build-caras-cuerpo.mjs`):

- **Qué cambia:** el cuadro 0 pasa a ser el paso del otro pie en S, SE, NE, N, NO y SO, y de frente el cuadro 3 es la zancada del otro lado. El perfil (E, O) no se toca: allí las dos piernas son del mismo color y el ciclo ya se lee; en los tres cuartos las zancadas ya alternaban lo bastante.
- **Cómo:** la mitad de arriba (cabeza, pelo, hombros) es la de siempre, así que los anclajes de gafas, audífonos, gorra y corona siguen valiendo; desde una fila de corte del pecho (la que mejor encaja, fija en el script) hacia abajo se usa la mitad de abajo en espejo de su propia vista (S con S, N con N, SE con SO, NE con NO). Nunca se voltea una vista por otra: la espalda no sale de un frente.
- **Café:** su tabla de anclaje tiene ahora cuatro cuadros por dirección para ella (`scripts/calcula-cafe.mjs`), porque la mano cambia en el 0 y en el 3 de frente. Corbata, medalla, capa, gafas, audífonos, gorra y corona se comprobaron sobre los cuadros nuevos sin cambios.
- **Pruebas:** `test/ciclo-femenino.test.mjs` (el atlas sale del script y es idempotente, la cabeza del 0 es la del 2, la mitad de abajo es el espejo de su fuente, el pie levantado alterna, la taza cae sobre una mano en cada cuadro).

## Movimiento de los protagonistas: balanceo y respiración (v40.16)

Medido en el atlas de él (v40.15): entre los cuatro cuadros de marcha cambian 0 píxeles de la cabeza a la cintura en las ocho direcciones, así que el cuerpo se deslizaba sin balanceo, y parado era una foto. En vez de tocar atlas (el arte de ella y el de él quedan idénticos) se añadió un **alza**: el tronco y la cabeza suben 1 px de la celda mientras los pies y las manos se quedan donde están.

- **Cómo:** `APRENDIZ.dibujar(..., alza)` y `dibujarPortada(..., alza)` pintan la celda ya compuesta (cuerpo y accesorio) en dos trozos: de la fila de corte hacia abajo, tal cual, y de la fila de corte hacia arriba, 1 px más arriba; la fila de corte se repite una vez, sin hueco. Sin alza, un solo `drawImage` igual que antes. Gafas, audífonos, gorra, corona, corbata, medalla y capa suben con el cuerpo; la taza se queda en la mano; el gato es independiente.
- **Dónde se corta:** `CORTE_ALZA` en `js/sprite.js` (por dirección al caminar y para la portada), calculada por `scripts/calcula-corte-alza.mjs`: la fila de cadera, entre 40 y 46, donde la repetición de una fila se nota menos. Él: la 43 en las ocho direcciones; ella entre la 41 y la 45.
- **Cuándo:** `APRENDIZ.alzaDe(mueve, paso, ms)`: caminando, 1 en los cuadros 1 y 3 (los del pie levantado); parado, respira: sube 1 s y baja 2 s (ciclo de 3 s, v40.17; en v40.16 era 1,2 s y 1,2 s, y se eligió entre tres ritmos comparados en video). Con prefers-reduced-motion es siempre 0.
- **Dónde se ve:** el pasillo (andando y parado; parado se repinta solo cuando cambia el alza) y el probador de Mi Avatar (la clave de repintado incluye el alza). El runner, el jefe y el mapa clásico no cambian: sprites de 30 px donde 1 px no se aprecia, y el mapa ya tiene su propio rebote.
- **No cambia:** atlas, accesorios, colisiones, velocidad, puntos, XP, dificultad ni nada guardado.
- **Pruebas:** `test/alza.test.mjs` (la tabla sale de los atlas; el alza de la marcha y de la respiración; sin alza el dibujo es el de antes; con alza de 1 px, de la fila de corte hacia abajo no cambia ni un píxel, de ahí hacia arriba todo sube 1 y no se pierde nada; sin huecos con cualquier alto) y el caso del vestidor.

## Fuera de esta parte

- No hay diálogos nuevos del protagonista.
- La sala de clase no sincroniza la apariencia (el proyector sigue con los campos de antes).
- No hay pantalla de elección al empezar partida: se elige en Mi Avatar.

## Siguiente

Los diálogos del protagonista, cuando se apruebe la biblia narrativa; la apariencia en la sala
de clase si se pide.
