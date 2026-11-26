# Plan: crecimiento, lanzamiento y lo que viene después

> Hecho el 2026-11-26 sobre la v40.25. Cada afirmación sobre el juego dice de dónde sale; las
> cifras de fuera llevan su enlace al final. **Las propuestas son propuestas**: cada una se hace
> en su versión, con su rama y sus pruebas, cuando el autor la elija.

## Decisiones del autor (2026-11-26)

| Pregunta | Respuesta |
|---|---|
| ¿Para qué se termina? | **Público y aulas SENA**: lanzarlo abierto (web, portales, Google Play) y llevarlo a clases con las salas que ya existen. |
| ¿Mundo abierto visto desde arriba? | **Primero mecánicas.** El pasillo se queda; el mundo abierto se piensa después del lanzamiento. |
| ¿Ayuda de otras IAs? | **Kit de contexto y recetas**: `AGENTS.md` (+ `CLAUDE.md`) y `planes/recetas-ia.md`. Sin claves ni costos. |
| Recortes | **Retratos en pixel** (punto D de `planes/pixel-art.md`). Ver `planes/terminar.md`. |

---

## 1. Dónde está el juego hoy

**Lo fuerte**
- **Lo visual está muy trabajado.** De la v26 a la v40.25 casi todas las versiones son de arte o
  presentación: jefe evolutivo, portada, pasillo HD, protagonistas, accesorios, logros, tienda y
  récords · de: `VERSIONES.md`.
- **Para aulas ya hay algo que casi ningún juego tiene**: salas de clase a su ritmo y **en vivo
  estilo Kahoot**, con proyector, podio y panel del instructor · de: `README.md` («Salas de clase»).
- **Para volver cada día:** reto diario igual para todos, con racha y premios · de: `README.md`.
- **Técnicamente listo para publicar:** PWA instalable que funciona sin conexión, ES/EN, pesa
  **2,9 MB** (`img` + `js` + `css` + `fuentes`, medido con `du`), sin dependencias.
- **Bien protegido contra fallos:** 358 pruebas unitarias, unos 200 casos de regresión en
  navegador y el barrido de los 15 días · de: CI de `main` (v40.25).

**Lo débil: las mecánicas**
- **Los 15 días usan solo 9 tipos de minijuego, y se repiten:** caza-bugs 3 veces (días 2, 7 y 13),
  simon de Git 3 veces (días 4, 9 y 14) y el runner 2 (días 10 y 15) · de: `NIVELES` en `js/datos.js`.
- **TERMINAL y ORDENA ya están hechos y no salen en la campaña**: solo en el modo libre, el reto y el
  sin fin · de: `README.md` («Barrido de la campaña»).
- **Casi todo es tocar o elegir.** El pasillo solo sirve para escoger el día: caminar por él no da
  nada · de: `planes/pasillo.md` («El pasillo no guarda nada»).
- **Hay poco contenido para alguien que repite:** 48 preguntas, 28 consultas SQL, 24 patrones de
  regex, 32 conflictos y 20 comandos de terminal · de: `js/datos.js` (contado el 2026-11-26).
- **Hay logros sin terminar:** de los 10 secretos, 5 tienen tarjeta y premio pero todavía no se
  pueden conseguir (s5, s9, s1, s8 y s2) · de: `LOGROS_SECRETOS` y `VERSIONES.md` (v40.19, «fase A»).

**Lo que no sabemos**
- **Nadie lo ha jugado en un celular real**, y no hay ninguna sesión de juego anotada · de:
  `planes/terminar.md`.
- **El XP de los días 10 y 15 no está medido**, porque el robot no le gana al jefe · de:
  `informe-barrido.md`.

**Conclusión:** el juego ya *se ve* como un juego terminado, pero *se juega* como una colección de
minijuegos cortos. Lo que más va a decidir si alguien vuelve, o se lo recomienda a otro, son las
mecánicas. Por eso van primero.

---

## 2. Mecánicas: más interactivo (antes del lanzamiento)

Van ordenadas por valor y costo. **Costo** es una estimación (S: una sesión · M: dos o tres ·
L: más). Cada una es una versión aparte, con su caso en `scripts/regresiones.mjs` y el barrido.

| # | Qué | Por qué | Costo |
|---|---|---|---|
| **M1** | **Variedad sin código nuevo:** el día 7 (proyecto formativo) pasa a **ORDENA** (ordenar los pasos del proyecto) y el día 9 (despliegue) a **TERMINAL** (escribir los comandos de verdad). | Quita dos de las repeticiones con minijuegos ya hechos y probados. Escribir `git push` enseña más que repetir una secuencia de colores. | S |
| **M2** | **Una vuelta a mitad de cada minijuego**: a la mitad cambia la regla. Por ejemplo: un bug que se divide en dos al aplastarlo; cartas de memoria que se barajan una vez; un paso trampa en el simon; un code review cuyo fallo está entre dos líneas. | Hoy cada minijuego es igual del primer al último segundo. Con un cambio a mitad, la ronda pide pensar y no solo reflejos. Se hace de a un minijuego por versión. | M cada uno |
| **M3** | **Jornadas encadenadas en los días clave (7 y 13)**: 2 o 3 minijuegos cortos seguidos con una pequeña historia («el bug llegó a producción → arréglalo → revisa el arreglo → despliega»). | El reto diario ya encadena tres minijuegos (`js/reto.js`): se reutiliza ese motor. Los días importantes se sienten importantes. | M |
| **M4** | **Una decisión por día en los diálogos**, con una consecuencia pequeña. Por ejemplo: ayudar a Valentina da 5 s más en el minijuego; seguir de largo, más puntos pero menos tiempo. | Da al jugador algo que decidir y hace que la historia sea suya. Además es la base de las misiones del campus futuro. | M |
| **M5** | **Misiones en el pasillo**: el personaje con «!» pide un favor, que es un reto de 20 s y da una pista, un objeto de la tienda o puntos. | Usa `js/consejos.js` y el globito «!» que ya existen. Hace que caminar por el pasillo sirva para algo, y es la **prueba barata de la idea del mundo abierto** (ver abajo). | M |
| **M6** | **Más contenido en los bancos**: preguntas de 48 a ~120, SQL de 28 a ~60, regex de 24 a ~50 y conflictos de 32 a ~60, siempre en ES/EN. | Quien repite deja de ver lo mismo. Es lo que mejor se reparte con otras IAs (receta en `planes/recetas-ia.md`), con revisión aquí antes de entrar. | S por tanda |
| **M7** | **Logros secretos, fase B**: que se puedan conseguir los 5 que faltan. | Ya se ven en la pantalla con su premio. Hoy son una promesa que no se cumple. | S–M |
| **M8** | **Mejoras de sensación** (sonido, temblores, ritmo) **solo donde lo pida una sesión de juego anotada**. | Sin datos de jugadores sería adivinar. Primero `/playtest`. | según lo que salga |

**Orden propuesto:** M1 → `/playtest` con 3 personas → M7 → M2 (empezando por el minijuego que más
aburra en el playtest) → M6 → M4 → M5 → M3. Antes de mover cualquier número de puntos, XP o tiempo,
se usa `/balance`.

### El mundo abierto, más adelante

Decisión del autor: después del lanzamiento. **Para no adivinar, primero se mide si explorar
engancha**: M4 y M5 lo prueban en el pasillo actual. Si en los playtests la gente habla con los
personajes y hace las misiones, se da el paso siguiente. Si no, el esfuerzo sigue en minijuegos.

La idea con la que se empezaría, si se da el paso, es un **campus por salas** visto desde arriba:
- **Las salas:** cafetería, biblioteca, laboratorio y oficina, que se recorren caminando.
- **Las puertas de los días siguen siendo la entrada a la campaña**, así nada de lo que funciona hoy
  se rompe.
- **Se reutiliza lo que ya existe:** el sprite en 8 direcciones (`js/sprite.js`), los NPC
  (`js/npc-sprites.js`) y las misiones de M5.
- **Se hace de a una sala por versión**, con la lista de días como respaldo para accesibilidad,
  igual que hoy (`planes/pasillo.md`, «Lo que no cambia»).

---

## 3. Lanzamiento: qué falta para darlo por terminado

Además de lo de `planes/terminar.md` (barrido en verde, pruebas, celular real), salir al público
abre temas que con amigos no existían:

- [ ] **Uso de la marca SENA.** El juego usa el nombre del SENA (título, textos y la pareja «SENA»
  del juego de memoria, `PAREJAS` en `js/datos.js`). Publicarlo en portales con anuncios o en Google
  Play con esa marca puede necesitar permiso. Hay dos caminos: **pedir aval** a un centro de
  formación o a la regional (sería además un apoyo enorme para el canal de aulas), o publicar en
  portales una **versión con nombre genérico** y dejar «SENA» para la versión de aulas.
  **Lo decide el autor.** No es un consejo legal.
- [ ] **Política de privacidad.** Google Play la exige. El marcador guarda nombres de hasta 10
  caracteres y un hash de la IP durante 24 horas (`db/anti-trampas.sql`), y en las aulas puede
  haber menores de edad. Hace falta una página corta que lo diga, pensada para la ley colombiana de
  datos personales (Ley 1581 de 2012).
- [ ] **Dominio para Google Play.** La app de Play (TWA) exige el archivo
  `/.well-known/assetlinks.json` en la **raíz** del dominio. La copia de GitHub Pages vive en
  `/aprendiz-en-apuros/` y no sirve para eso; el dominio de Vercel, o uno propio, sí.
- [ ] **Material para mostrarlo:** un tráiler de 30 s, 5 capturas (celular y escritorio), un GIF
  de la transformación del jefe y una página de prensa con una descripción corta.
- [ ] **Guía de una página para instructores**: cómo crear una sala, cuánto dura y qué temas cubre
  cada día.

---

## 4. Crecimiento: dónde y cómo llamar la atención

### Aulas SENA (el canal más fuerte)
- **Lo diferenciador son las salas en vivo.** Un instructor puede usarlas mañana mismo sin instalar
  nada. El mensaje: *«Kahoot de programación con historia de aprendiz SENA, gratis y sin cuentas»*.
- **Un piloto real**: una ficha de un centro de formación juega una sala en vivo. De ahí salen
  testimonios, fotos (con permiso) y el primer playtest de verdad.
- **El público natural es grande:** el tecnólogo en Análisis y Desarrollo de Software (ADSO) tiene
  unos 72.000 aprendices, el 17,8 % de los tecnólogos según Blu Radio. El juego cuenta el técnico en
  Programación, pero la experiencia de aprendiz es la misma.
- **Dónde contarlo:** semilleros, Tecnoparque, grupos de fichas y de instructores, y
  ferias de los centros.

### Público general
1. **itch.io primero:** es gratis, admite juegos HTML5 tal cual y tiene devlogs. Sirve para
   practicar el lanzamiento sin riesgo.
2. **Portales web (CrazyGames y Poki)**, después del playtest y con la marca resuelta.
   CrazyGames reparte ingresos por anuncios solo a través de su SDK. Las cifras de reparto que
   circulan (60 % de anuncios y 70 % de compras en CrazyGames; 50/50 en Poki) **no están
   confirmadas** en sus páginas oficiales. Poki elige qué juegos publica, y una guía cita un
   límite de 8 MB de descarga inicial: el juego pesa 2,9 MB.
3. **Google Play como app:** la PWA se empaqueta con PWABuilder o Bubblewrap (Trusted Web Activity).
   Hace falta una cuenta de desarrollador, el `assetlinks.json` y la política de privacidad.
   Las actualizaciones siguen llegando por la web, sin volver a subir la app.

### Contenido corto (TikTok, Reels, Shorts)
- **Clips de 10 s** con momentos que la gente quiera compartir: la transformación del jefe, una
  interrupción «¡SE CAYÓ EL WIFI!» a mitad de prueba, el «antes y después» del arte, y humor de
  aprendiz que cualquiera del SENA reconoce.
- **Constancia antes que buscar lo viral**: varias guías coinciden en que los anuncios pagados en
  TikTok rara vez rinden para juegos indie. Lo que sí funciona es contar el proceso.
- **Un ángulo honesto: «juego hecho con IA»** (lo dice el `README.md`). Contar cómo se hace atrae
  curiosidad. También despierta críticas, así que conviene enseñar lo que el autor decide y revisa.

### Eventos y convocatorias (Colombia)
- **SOFA, Beta Test Fest** (Bogotá, octubre): en 2026 reunió 28 juegos latinoamericanos con voto del
  público. Es un buen objetivo para 2027.
- **Crea Digital (MinTIC)**: tiene una categoría de videojuegos que pide una versión alfa funcional,
  y MinTIC habla de reconocimientos de hasta $100 millones COP. La de 2026 ya cerró; hay que estar
  atentos a la de 2027 y leer bien los términos.

### Qué medir (con lo que ya hay)
- **Visitas:** Vercel Web Analytics, que ya está en `index.html`.
- **Partidas terminadas** (días 10 y 15): el marcador global.
- **Uso en aulas:** las salas creadas por semana (tabla de salas en Supabase).
- **Tres preguntas para decidir el siguiente paso:** ¿cuántos pasan del día 1 al 5? ¿cuántos llegan
  al 10? ¿cuántos vuelven al reto diario al día siguiente? Las dos primeras necesitan contar
  eventos; antes de añadir nada, se decide qué se guarda y se refleja en la política de privacidad.

---

## 5. Después del lanzamiento: actualizaciones que gusten

**Ritmo propuesto:** un arreglo pequeño cada dos semanas y una novedad grande por trimestre. Cada
una con su aviso de NOVEDADES, que ya existe (`README.md`, «Versiones y novedades»).

| Cuándo | Qué | Para quién |
|---|---|---|
| Cada mes | **Temporada del reto diario** con tema (mes del SQL, semana de Git) y un premio cosmético que solo se gana ese mes; el sistema de camisas y accesorios ya existe | todos |
| Cada mes | **Tanda de contenido nuevo** en los bancos (M6), con lo que más fallan los jugadores según el panel del instructor | aulas |
| Trimestre 1 | **Preguntas propias del instructor** para su sala (su tema, su ficha). Necesita cambios en la base, con sus pruebas como las de `db/pruebas/` | aulas |
| Trimestre 2 | **«Primer empleo»**: días 16–20 después del título, con un jefe nuevo | todos |
| Trimestre 3 | **Campus por salas** (sección 2), solo si las misiones del pasillo engancharon | todos |
| Siempre | **La comunidad elige**: una encuesta por trimestre sobre la siguiente novedad, y los nombres de quienes reportan fallos en los créditos | todos |

---

## 6. Trabajar con otras IAs

- **`AGENTS.md`**: el contexto y las reglas del proyecto, en un solo archivo. Lo leen Codex, Gemini
  CLI, Cursor y Copilot; Claude Code lo lee a través de `CLAUDE.md`. Si se usa ChatGPT o Gemini en
  el navegador, se pega al empezar la conversación.
- **`planes/recetas-ia.md`**: qué IA usar para qué (arte, textos, preguntas y voz), prompts listos y
  el formato exacto de cada dato.
- **La regla que no cambia:** lo que venga de otra IA entra como **propuesta**, en su rama. Pasa
  `validar`, las pruebas, `tsc`, las regresiones y una revisión antes de llegar a `main`, igual que
  cualquier otro cambio.

---

## Fuentes de fuera (consultadas el 2026-11-26)

- Blu Radio, tecnólogos del SENA con más demanda (ADSO, 72.144 aprendices): https://www.bluradio.com/sociedad/educacion/estos-son-los-20-tecnologos-del-sena-con-mas-oportunidades-de-empleo-en-colombia-so35
- Documentación para desarrolladores de CrazyGames (anuncios solo por SDK): https://docs.crazygames.com/requirements/intro/
- Comparativa Poki / CrazyGames / GameDistribution (cifras de terceros, no confirmadas): https://playgama.com/blog/business-faqs/poki-vs-crazygames-vs-gamedistribution-revenue-share/
- Guía para publicar en Poki (límite de 8 MB citado por terceros): https://app.cinevva.com/guides/publish-game-poki
- Google, publicar una PWA en Google Play: https://developers.google.com/codelabs/pwa-in-play
- How To Market A Game, consejos para TikTok: https://howtomarketagame.com/seven-great-tips-for-marketing-your-indie-game-on-tiktok/
- Game Developer, caso «de 400 a 20.000 wishlists con un video»: https://www.gamedeveloper.com/game-platforms/from-400-to-20-000-wishlists-with-1-video-how-tiktok-can-make-your-game-go-viral
- MinTIC, Crea Digital 2026: https://mintic.gov.co/creadigital/871/w3-propertyvalue-1014235.html
- Publimetro, SOFA 2026 Beta Test Fest: https://www.publimetro.co/tecnologia/2026/10/06/sofa-2026-gamers-podran-probar-28-videojuegos-latinoamericanos-y-elegir-el-mejor-de-la-edicion/
- Kellogg (Northwestern), aprendizaje en un juego de mundo abierto: https://insight.kellogg.northwestern.edu/article/education-and-entertainment-not-a-zero-sum-game
