# Plan: el pasillo del centro de formación

> Estado: **idea aprobada, diseño por definir**. Nada de esto está programado
> todavía. Falta cerrar las decisiones del final y empezar por la fase 1.

## La idea en una frase

El mapa de días se convierte en un **pasillo en pixel** por el que camina el
aprendiz: cada **puerta es un día**, y **los personajes del juego están ahí**
para darle consejos (con su retrato dibujado en el diálogo).

## Cómo se ve

- **Dos pasillos, uno por etapa**
  - **Etapa lectiva (días 1–10):** pasillo del centro de formación, con puertas
    de ambientes de formación, tablero de anuncios y cartelera.
  - **Etapa productiva (días 11–15):** pasillo de la oficina de la empresa, con
    otra paleta, escritorios y máquina de café.
  - Se pasa de uno al otro por unas escaleras o un ascensor al final, que se
    abren al terminar el día 10.
- **Las puertas**
  - Letrero encima con el número del día y el icono del minijuego.
  - 🔒 Bloqueadas: cerradas y con candado.
  - ★ Superadas: sus estrellas en el letrero.
  - ✨ La del día que toca: brilla con un marco que late.
  - 👾 Al final del pasillo productivo, la puerta del **Bug final**, que aparece
    al ganarle por primera vez.
- **Se reutiliza lo que ya hay:** el sprite del aprendiz en sus 8 direcciones
  con su piel y camisa (`js/sprite.js`), los efectos de `js/efectos.js` (la
  cortina de pixeles al entrar por una puerta) y la tipografía del juego.

## Cómo se juega

- **Celular:** tocas una puerta o un personaje y el aprendiz camina hasta allí.
  El pasillo se desplaza siguiendo al aprendiz.
- **Computador:** ← → para caminar, Enter para entrar o hablar.
- **Mando:** cruceta y botón A (el juego ya lee mandos, `leerMando()`).
- Al llegar a una puerta sale un cartelito con el nombre del día, sus estrellas
  y el botón **Entrar**.

## Los personajes y sus consejos

Ya existen tres personajes con cara propia en los diálogos (`CARAS` en
`js/graficos.js`): el **Instructor** (canoso, gafas), la **Compañera** (camisa
roja, pelo largo) y el **Líder técnico** (camisa morada, corbata).

| Pasillo    | Quién         | Qué hace                                               |
|------------|---------------|--------------------------------------------------------|
| Lectiva    | Instructor    | Consejo sobre el minijuego de la puerta de al lado     |
| Lectiva    | Compañera     | Ánimo y trucos ("en el runner, agáchate con los papeles") |
| Productiva | Líder técnico | Consejos de "trabajo real" (SQL, Git, terminal)        |
| Productiva | Compañera     | Te sigue a la empresa: continuidad de la historia      |

- **Consejos personalizados:** el juego ya guarda en qué preguntas fallas
  (`S.pesos`, lo usa el modo Repaso). Un personaje puede decir *"Vi que te
  cuesta SQL: el WHERE va antes del ORDER BY"* y ofrecer ir directo al Repaso
  de ese tema.
- Sin nada pendiente: consejos generales o felicitaciones.
- Globito **"!"** encima de quien tenga algo nuevo que decir.

## Retratos dibujados (fase aparte)

- En los diálogos se ve el retrato dibujado si existe; si no, el pixelado de
  siempre.
- Opción en Ajustes: **Retratos: Pixel / Ilustrado**.
- Las imágenes se generan con ChatGPT o Gemini: 3 personajes × 5 expresiones
  (normal, feliz, enojado, sorprendido, preocupado) ≈ **15 imágenes** en WebP
  de ~40 KB.
- Método para que salgan iguales: primero una **hoja de personaje** (frente,
  tres cuartos y expresiones); después cada imagen se pide pasando esa hoja
  como referencia, con el mismo prompt base y la misma paleta.
- El **aprendiz sigue en pixel**: con 4 pieles × 4 camisas harían falta 16
  versiones de cada imagen.

## Lo que no cambia

- La **lista de días sigue existiendo** (botón "Ver como lista"): para teclado,
  lector de pantalla, "reducir movimiento" y móviles muy lentos.
- Progreso, estrellas, modos (libre, repaso, reto, salas) y ranking quedan
  igual. Solo cambia cómo eliges el día de la campaña.

## Fases

| Fase | Qué                                                                 | Depende del autor          |
|------|---------------------------------------------------------------------|----------------------------|
| 1    | Pasillo jugable: puertas, caminar, entrar, los 2 pasillos y la lista de respaldo | No              |
| 2    | Personajes en el pasillo con consejos (también los personalizados)   | Revisar los textos         |
| 3    | Retratos dibujados en los diálogos y opción en Ajustes               | Generar las imágenes       |
| 4    | Animación de caminar de verdad (2–4 cuadros), sonido de pasos, puertas que se abren | Opcional    |

Las fases 1 y 2 juntas serían una actualización (v42). La 3 va cuando estén las
imágenes.

## Decisiones de diseño pendientes

1. **¿Pasillo en lugar del mapa, o como opción?** Propuesta: por defecto, con
   la lista de respaldo.
2. **Personajes:** ¿Instructor, Compañera y Líder? ¿Con nombre propio
   (por ejemplo "Instructora Marta")?
3. **¿Algún personaje nuevo?** Por ejemplo un aprendiz veterano o el vigilante
   de la entrada.
4. **Estilo de los retratos dibujados:** ¿más caricatura o más realista? Define
   los prompts para la IA.
