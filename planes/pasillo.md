# Plan: el pasillo del centro de formación

> Estado: **fase 1 hecha (v22)**. El pasillo ya es el mapa de la campaña
> (`js/pasillo.js`). Falta la fase 2: los personajes y sus consejos.

## Lo que quedó en la v22 (fase 1)

Llegó como paquete del autor (*Pasillo interactivo v44-rc1*, hecho sobre la v43
vieja) y se integró sobre la v21.5. Se hizo así, que no es exactamente lo que
decía el plan de abajo:

- **Tres zonas de cinco puertas**, no dos pasillos con desplazamiento:
  Formación · Aulas (días 1–5), Formación · Laboratorios (6–10) y
  Empresa · Oficinas (11–15, con otra paleta). Se cambia de zona con
  Anterior / Siguiente o con las tres pestañas.
- Tocas una puerta, el aprendiz **camina** hasta ella y sale su **ficha**
  (nombre, estado, estrellas) con el botón de entrar. La puerta se abre y se
  entra con `empezarDia(i)`: cutscenes, diálogos y minijuegos son los de siempre.
- Las puertas cerradas enseñan su ficha pero no dejan entrar.
- El pasillo **no guarda nada**: el estado sale de `S.dias` y `progreso()`.
- **Ver como lista** abre la lista de días de antes (`rMapaLista()`), con la
  casilla para repetir al jefe.
- Teclado: ← → eligen puerta, Enter entra. Respeta "reducir movimiento".
- Desde la v22.2: al abrir, el aprendiz ya espera delante de la puerta del
  día que toca con la ficha lista (seguir la campaña es un toque); tocar otra
  vez la puerta en la que estás también entra; y cada letrero lleva el icono
  de su minijuego.
- El fondo es CSS, sin imagen: los letreros se traducen y todo crece con el
  zoom del marco.

Lo que NO entró y sigue pendiente de este plan: escaleras o ascensor entre
etapas, la puerta propia del Bug final (hoy es un botón debajo), el mando, el
sonido de pasos y toda la fase 2.

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
| 1    | ✅ Pasillo jugable: puertas, caminar, entrar, las 3 zonas y la lista de respaldo | Hecho (v22)     |
| 2    | Personajes en el pasillo con consejos (también los personalizados)   | Revisar los textos         |
| 3    | ✅ Retratos dibujados en los diálogos, el jurado del quiz y opción en Personalización | Hecho (15 imágenes en `arte/retratos/`) |
| 4    | ✅ Caminata de 4 cuadros en 8 direcciones (`img/aprendiz-caminar.png`, ya se usa en el jefe y el mapa). Falta: sonido de pasos, puertas que se abren | Opcional |

La fase 1 salió como v22. La fase 2 (personajes y consejos) sería la siguiente
versión grande.

## Decisiones de diseño pendientes

1. **¿Pasillo en lugar del mapa, o como opción?** Propuesta: por defecto, con
   la lista de respaldo.
2. **Personajes:** ¿Instructor, Compañera y Líder? ¿Con nombre propio
   (por ejemplo "Instructora Marta")?
3. **¿Algún personaje nuevo?** Por ejemplo un aprendiz veterano o el vigilante
   de la entrada.
4. **Estilo de los retratos dibujados:** ¿más caricatura o más realista? Define
   los prompts para la IA.
