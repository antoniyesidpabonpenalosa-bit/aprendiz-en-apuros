# Personajes y consejos del pasillo · borrador para revisar

> Estado: **hecho en la v24.** Es la fase 2 de `planes/pasillo.md`. Se programó con las
> respuestas del autor: nombres propios (Gustavo, Valentina, Andrés y Don Jairo) y el
> vigilante incluido; los personajes se ven con el cuerpo del aprendiz recoloreado (opción A).
> Los textos viven ahora en `js/consejos.js`; este archivo queda como la propuesta original.
> Don Jairo ya tiene sus 5 retratos dibujados (`arte/retratos/vigilante-*.png`), hechos
> con el prompt de abajo.

## Cómo lo vería el jugador

- En cada zona del pasillo hay **dos o tres personajes parados** entre las puertas.
- Tocas a uno y **te aconseja**, con su retrato dibujado y su gesto, igual que en los
  diálogos de cada día. Un globito **"!"** encima de quien tenga algo nuevo que decir.
- Lo que dice depende de lo que pasa:
  1. Si fallas mucho un tema, el personaje lo nota y se ofrece a **llevarte al Repaso**
     de ese tema (el juego ya guarda en qué preguntas fallas).
  2. Si no, te aconseja sobre **la puerta del día que toca**.
  3. Si ya vas al día, un consejo general o una felicitación.
- **No cambia nada del juego**: no dan puntos ni quitan vidas. Solo hablan.

## Quién está en cada zona

Sale de los diálogos del propio juego: cada personaje está donde ya habla.

| Zona | Días | Personajes | Por qué |
|---|---|---|---|
| 1 · Formación · Aulas | 1–5 | **Instructor**, **Compañera** | Manda el instructor; la compañera habla en el día 3 |
| 2 · Formación · Laboratorios | 6–10 | **Compañera**, **Instructor** | La compañera habla en los días 6, 7 y 8; el instructor en el 9 y el 10 |
| 3 · Empresa · Oficinas | 11–15 | **Líder técnico**, **Compañera**, **Instructor** | El líder manda; la compañera habla en el 12; el instructor viene al seguimiento (día 14) |

Y uno **nuevo** (abajo): **el vigilante**, en la zona 1, junto a la entrada.

## Nombres propios (decisión tuya)

- **Opción A: sin nombre**, como están hoy ("INSTRUCTOR", "COMPAÑERA", "LÍDER TÉCNICO").
- **Opción B: con nombre**, por ejemplo: *Instructor Gustavo*, *Valentina* (la compañera),
  *Andrés* (el líder técnico) y *Don Jairo* (el vigilante). Son sugerencias mías; cambia los que quieras.

> Para programar la opción B hay que cambiar cómo el juego reconoce a cada personaje
> (hoy lo hace por la palabra INSTRUCTOR / COMPAÑERA / LÍDER en `js/graficos.js`). Es pequeño.

## Cómo se ven en el pasillo

Los tres personajes de la historia **no tienen cuerpo en pixel**; solo retrato dibujado.
Dos formas de ponerlos entre las puertas:

- **A (recomendada, sin arte nuevo):** usar el mismo cuerpo del aprendiz con **la piel y la
  camisa de cada uno** (el juego ya sabe recolorearlo). Le falta el pelo gris del instructor
  o la gorra del vigilante; el retrato dibujado, que sale al tocarlos, sí los tiene.
- **B (más bonito, más arte):** un sprite de cuerpo entero por personaje. Son 4 imágenes nuevas
  y un prompt aparte para cada una; te lo preparo si eliges esta.

---

## 1 · Consejo de la puerta (el día que toca)

Lo dice quien habla en el diálogo de ese día. Cada consejo usa lo que el propio juego explica
de ese minijuego (la ficha de ayuda), no inventa reglas.

| Día | Quién | Español | English |
|---|---|---|---|
| 1 · Primer día | Instructor | Lee el comando completo antes de escribir. Con calma sale más rápido que con prisa. | Read the whole command before typing. Calm beats rushing. |
| 2 · Caza-bugs | Instructor | Toca el bug apenas asome. También valen las teclas 1 a 9, y el ☕ da puntos extra. | Tap the bug as soon as it pops up. Keys 1 to 9 work too, and the ☕ gives bonus points. |
| 3 · Memoria técnica | Compañera | ¡Menos giros, más estrellas! Fíjate dónde viste cada carta antes de destapar la segunda. | Fewer flips, more stars! Remember where you saw each card before flipping the second. |
| 4 · Flujo Git | Instructor | Cada ronda añade UN comando. Repítelos en voz baja mientras se iluminan: ayuda. | Each round adds ONE command. Repeat them under your breath as they light up: it helps. |
| 5 · Sustentación | Instructor | No hay reloj: lee las tres respuestas enteras. Lo que falles volverá a salir, así que fallar también enseña. | No timer: read all three answers. What you miss comes back, so missing teaches too. |
| 6 · Code review | Compañera | Ojo con el = donde debería ir ===. Es el error favorito del código de la ficha de al lado. | Watch for = where === belongs. It is the favourite mistake in the other group's code. |
| 7 · Proyecto formativo | Compañera | Hoy son MUCHOS. No persigas uno solo: toca el que asome y sigue. ¡Y el ☕ suma! | There are LOTS today. Don't chase just one: tap whichever pops up and move on. The ☕ adds points! |
| 8 · Conflicto Git | Compañera | Casi siempre falla un paréntesis o una comilla. Compara las dos líneas de izquierda a derecha. | Usually a bracket or a quote is missing. Compare the two lines left to right. |
| 9 · Despliegue | Instructor | Un comando fuera de orden y se cae todo. Mira la secuencia completa antes de repetirla. | One command out of order and everything falls. Watch the whole sequence before repeating it. |
| 10 · Evaluación final | Instructor | ▲ para saltar, ▼ para agacharte: los papeles vuelan altos. Y agarra los cafés. | ▲ to jump, ▼ to duck: the papers fly high. And grab the coffees. |
| 11 · Consulta SQL | Líder técnico | SELECT, FROM, WHERE, en ese orden. Una pieza mal puesta cuenta como error. | SELECT, FROM, WHERE, in that order. A piece in the wrong place counts as an error. |
| 12 · Caza patrones | Compañera | Toca SOLO lo que cumple el patrón. Tocar uno que no cumple es un error: lee el patrón dos veces. | Tap ONLY what matches the pattern. Tapping one that does not is an error: read the pattern twice. |
| 13 · Bugs nivel 2 | Líder técnico | Las bombas de imitación quitan puntos. Si dudas, no toques. | The fake bombs take points away. If in doubt, don't tap. |
| 14 · Git avanzado | Instructor | Lo mismo que en la lectiva: cada ronda suma un comando. Ahora con rebase y stash; repítelos bajito. | Same as in training: each round adds a command. Now with rebase and stash; repeat them quietly. |
| 15 · Deploy nocturno | Líder técnico | Última prueba: ▲ o espacio para saltar, ▼ para agacharte. Cafés seguidos te dan racha. | Final trial: ▲ or space to jump, ▼ to duck. Coffees in a row build a streak. |

## 2 · Consejos personalizados (cuando fallas un tema)

Salen del Repaso que el juego ya calcula (`temasRepaso()`): cuando un tema tiene preguntas
pendientes, el personaje de ese tema lo nota y ofrece un botón **"Repasar"** que abre ese tema.

| Tema | Quién | Español | English |
|---|---|---|---|
| Sustentación (quiz) | Instructor | Vi que el cuestionario se te complica. Lo que fallas vuelve a salir hasta que lo domines. ¿Lo repasamos? | I saw the quiz is giving you trouble. What you miss comes back until you master it. Shall we review it? |
| Code review | Compañera | Vi que el code review te cuesta. Fíjate en el = contra ===, y en las comillas que faltan. | I saw code review is hard for you. Look at = versus ===, and at missing quotes. |
| SQL | Líder técnico | SQL se te atraviesa, ¿cierto? Piensa en el orden: SELECT, FROM, WHERE. ¿Repasamos? | SQL is giving you a hard time, right? Think of the order: SELECT, FROM, WHERE. Shall we review? |
| Regex | Líder técnico | Las expresiones regulares cuestan al principio. Lee qué pide el patrón, no cómo se ve. | Regular expressions are hard at first. Read what the pattern asks for, not how it looks. |
| Conflictos de Git | Compañera | Los conflictos casi siempre son un paréntesis o una comilla. Míralas con calma, ¡yo te ayudo a repasar! | Conflicts are almost always a bracket or a quote. Look at them calmly. I'll help you review! |
| Comandos (mecanografía) | Instructor | Los comandos se aprenden con los dedos. Un repaso corto cada día vale más que uno largo. | Commands are learned with your fingers. A short review every day beats a long one. |
| Flujo de Git | Instructor | El flujo de Git es siempre el mismo. Repítelo hasta que te salga solo. | The Git flow is always the same. Repeat it until it comes naturally. |
| Parejas de tecnologías | Compañera | Las parejas se pegan con práctica. ¡Un repaso y las tienes! | The pairs stick with practice. One review and you've got them! |
| Terminal | Instructor | Si fallas un comando el juego te muestra cuál era: así se aprende. Repasemos esos. | If you miss a command the game shows you which one it was: that is how you learn. Let's review those. |
| Algoritmo (orden) | Instructor | Cada tanda es un proceso real del trabajo. Piensa qué se hace primero. | Each round is a real process from the job. Think about what is done first. |

## 3 · Consejos generales (cuando vas al día)

| Quién | Español | English |
|---|---|---|
| Instructor | Vas al día con todo. Aprovecha para practicar en el modo libre. | You're up to date on everything. A good time to practise in free play. |
| Instructor | Un día a la vez. Lo importante es que no te quedes sin entender. | One day at a time. What matters is not leaving anything not understood. |
| Instructor | Descansa la vista: el código se ve mejor con ojos frescos. | Rest your eyes: code reads better with fresh eyes. |
| Compañera | ¡Vamos bien! Si un día se te quedó en 2 estrellas, vuelve y sácale las 3. | We're doing great! If a day stayed at 2 stars, go back and get all 3. |
| Compañera | ¿Ya probaste el reto diario? Hay uno nuevo cada día. | Have you tried the daily challenge? There is a new one every day. |
| Compañera | ¡No te rindas, que casi lo logras! | Don't give up, you're almost there! |
| Líder técnico | Buen trabajo. En la empresa se valora quien deja el código limpio. | Good work. At the company, people who leave clean code are valued. |
| Líder técnico | Antes de entregar, revisa dos veces. Siempre. | Before delivering, check twice. Always. |
| Líder técnico | Si te trabas, pregunta. Nadie aprende solo. | If you get stuck, ask. Nobody learns alone. |

---

## 4 · Personaje nuevo: el vigilante (Don Jairo)

**Quién es:** el vigilante de la entrada del centro de formación, de unos 55 años.
Conversador y bromista, **ve todo desde la portería** y trata a todos de "aprendiz". Su
papel en el juego es distinto al de los otros: **no enseña programación, te cuenta qué
más hay en el juego** (tienda, reto diario, modo libre, salas…), que es lo que un jugador
nuevo suele no encontrar.

**Dónde:** zona 1, junto a la entrada. Tiene un tinto en la mano (el ☕ ya es un símbolo del juego).

**Qué dice** (rota entre estos, uno por toque):

| Tema | Español | English |
|---|---|---|
| Tienda | ¿Ya pasó por la tienda, aprendiz? Con los puntos compra mejoras y cosas para su personaje. | Have you been to the shop yet, apprentice? With your points you can buy upgrades and things for your character. |
| Reto diario | Cada día hay un reto nuevo. Si juega días seguidos, la racha le da premios. | There is a new challenge every day. If you play on consecutive days, the streak earns you rewards. |
| Modo libre | En el modo libre juega el minijuego que quiera, sin XP: solo marca un récord. Ideal para practicar. | In free play you pick any minigame, with no XP: it just sets a score. Great for practice. |
| Repaso | El juego se acuerda de lo que usted falla. En REPASO practica justo eso. | The game remembers what you miss. In REVIEW you practise exactly that. |
| Sin fin | El modo sin fin es una sola vida, y cada tres rondas sube la dificultad. ¡Atrévase! | Endless mode is a single life, and every three rounds the difficulty goes up. Dare to try it! |
| Salas | Si es de una clase, el instructor abre una sala con un código y juegan todos a la vez. | If you are in a class, the instructor opens a room with a code and everyone plays at once. |

> Habla de "usted" en español, como un vigilante respetuoso. Si prefieres que tutee como los
> demás, se cambia en un minuto.

### Prompt para generar sus imágenes (ChatGPT o Gemini)

**Cómo usarlo:** abre una conversación nueva, **adjunta los retratos que ya tienes**
(`instructor-normal.png`, `companera-feliz.png`, `lider-preocupado.png`, están en
`arte/retratos/`) y pega primero el *prompt base*. Cuando te guste el resultado, pide
una a una las otras 4 expresiones **en la misma conversación**, para que sea el mismo personaje.
Necesitas 5 imágenes en total (normal, feliz, enojado, sorprendido, preocupado), igual que los otros.

**Prompt base** (en inglés, los generadores lo entienden mejor):

```
Use the attached three portraits as the exact art-style reference (same line weight,
same shading, same level of detail, same colour saturation).

Create a chest-up bust portrait of a friendly Colombian security guard, called
"Don Jairo", in his mid-50s. Stocky build, warm medium-brown skin, thick black
mustache with a few grey hairs, short salt-and-pepper hair under a navy-blue
security cap with a small badge. He wears a light-grey short-sleeve guard uniform
shirt with an ID badge on the chest pocket and a small walkie-talkie clipped to
the shoulder. In one hand he holds a small steaming cup of coffee. Slight three-quarter
view turned to the right, eyes looking off to the side, calm friendly half-smile.

Style: 2D cartoon game character portrait, thick clean black outline, soft painterly
cel shading with subtle brush texture, warm saturated colours, simple readable shapes.
Transparent background (PNG), 1024x1024, character centered, cropped at the chest.
No text, no logo, no frame, no extra characters.
```

**Las otras cuatro** (pegar una por una, en la misma conversación; que no cambie la ropa ni la cara, solo el gesto):

```
feliz:        Same character, same outfit, same style. Laughing with eyes closed and a wide
              open smile, small yellow "ding" lines beside his head, like the attached
              cheerful portrait.
enojado:      Same character, same outfit, same style. Frowning, thick eyebrows pulled down,
              mouth tense, one small red anger mark near his temple.
sorprendido:  Same character, same outfit, same style. Eyes wide open, eyebrows raised high,
              mouth open in an "o", the coffee cup slightly tilted, small shock lines.
preocupado:   Same character, same outfit, same style. Worried look, eyebrows raised in the
              middle, one hand on his chin, like the attached thoughtful portrait.
```

**Si la herramienta no da fondo transparente**, pide "fondo blanco liso" y me pasas las
imágenes: yo recorto el fondo y las convierto igual que hice con las otras 15
(`scripts/build-retratos.mjs`).

---

## Lo que necesito de ti

1. **¿Con nombre propio o sin nombre?** (A o B de arriba)
2. **¿Te gusta el vigilante?** Si sí, genera las 5 imágenes con el prompt. Si no, lo quito
   y quedan solo los tres de siempre; no pierdes nada.
3. **¿Cómo se ven en el pasillo?** (A: cuerpo del aprendiz recoloreado, o B: sprites nuevos.)
4. **Revisa los textos.** Marca lo que cambiarías. Los de la puerta del día y los de
   Repaso salen de lo que el propio juego ya explica; los generales y los del vigilante son
   los más "míos" y los que más conviene que leas.
