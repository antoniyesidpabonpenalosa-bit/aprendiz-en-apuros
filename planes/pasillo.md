# Plan: el pasillo del centro de formación

> Estado: **hecho** (v22 y v24). El pasillo ya es el mapa de la campaña
> (`js/pasillo.js`) y los personajes están en él con sus consejos (`js/consejos.js`;
> los textos, en `planes/personajes-consejos.md`). Los cuatro, con nombre propio
> (Gustavo, Valentina, Andrés y Don Jairo), tienen sus 5 retratos dibujados.
> Este documento queda como historia de lo que se pensó; lo que difiere de lo
> hecho está marcado abajo. Tres cosas se recortaron a propósito el 2026-11-13
> (ver "Lo que NO entró").

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

## Lo que NO entró

Recortado a propósito (2026-11-13, con `/terminar`):
- **Escaleras o ascensor entre etapas:** se hicieron tres zonas que ya se cambian
  con Anterior / Siguiente y las pestañas.
- **Sonido de pasos:** el aprendiz ya camina con animación.
- **Mando (cruceta y A) en el pasillo:** el toque y el teclado cubren el pasillo;
  solo el runner y el jefe leen mando.

Opcional, queda como está: la **puerta propia del Bug final** (hoy es un botón
"Repetir Bug final" debajo de la escena; funciona, es solo presentación).

## La idea en una frase

El mapa de días se convierte en un **pasillo en pixel** por el que camina el
aprendiz: cada **puerta es un día**, y **los personajes del juego están ahí**
para darle consejos (con su retrato dibujado en el diálogo).

## Cómo se ve

- **Tres zonas** *(en el plan eran dos pasillos con escaleras; ver "Lo que quedó en la v22")*
  - **Formación · Aulas (días 1–5)** y **Formación · Laboratorios (días 6–10)**:
    el centro de formación.
  - **Empresa · Oficinas (días 11–15):** la oficina de la empresa, con otra paleta.
  - Se cambia de zona con Anterior / Siguiente o con las tres pestañas.
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
- **Mando:** no entró en el pasillo (recortado; ver "Lo que NO entró").
- Al llegar a una puerta sale un cartelito con el nombre del día, sus estrellas
  y el botón **Entrar**.

## Los personajes y sus consejos

**Hecho en la v24.** Cuatro personajes con nombre propio: **Gustavo** (instructor),
**Valentina** (compañera), **Andrés** (líder técnico) y **Don Jairo** (el vigilante
de la entrada, que cuenta qué más hay en el juego). Cada zona trae a los suyos:

| Zona                         | Quiénes                          |
|------------------------------|----------------------------------|
| Formación · Aulas            | Gustavo, Don Jairo, Valentina    |
| Formación · Laboratorios     | Valentina, Gustavo               |
| Empresa · Oficinas           | Andrés, Valentina, Gustavo       |

Qué dicen (consejo de puerta, de tema flojo o general) y la regla que lo elige:
`planes/personajes-consejos.md` y `js/consejos.js`.

- **Consejos personalizados** *(hecho en la v24)*: el juego ya guarda en qué preguntas fallas
  (`S.pesos`, lo usa el modo Repaso). Un personaje puede decir *"Vi que te
  cuesta SQL: el WHERE va antes del ORDER BY"* y ofrecer ir directo al Repaso
  de ese tema.
- Sin nada pendiente: consejos generales o felicitaciones.
- Globito **"!"** encima de quien tenga algo nuevo que decir *(hecho)*.

## Retratos dibujados (fase aparte)

- En los diálogos se ve el retrato dibujado si existe; si no, el pixelado de
  siempre.
- Opción en Ajustes: **Retratos: Pixel / Ilustrado**.
- Las imágenes se generan con ChatGPT o Gemini: 4 personajes × 5 expresiones
  (normal, feliz, enojado, sorprendido, preocupado) = **20 imágenes** en WebP
  (fuente en `arte/retratos/`, resultado en `img/retratos/`).
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
| 2    | ✅ Personajes en el pasillo con consejos (también los personalizados) | Hecho (v24) |
| 3    | ✅ Retratos dibujados en los diálogos, el jurado del quiz y opción en Personalización | Hecho (15 imágenes en `arte/retratos/`) |
| 4    | ✅ Caminata de 4 cuadros en 8 direcciones (`img/aprendiz-caminar.png`, ya se usa en el jefe y el mapa). El sonido de pasos se recortó; las puertas que se abren no se hicieron | Hecho / recortado |

La fase 1 salió como v22 y la fase 2 como v24.

## Decisiones de diseño (todas resueltas)

1. **¿Pasillo en lugar del mapa, o como opción?** Pasillo por defecto, con la
   lista de respaldo ("Ver como lista"). Hecho en la v22.
2. **Personajes:** los tres de siempre, ahora con nombre propio (Gustavo,
   Valentina, Andrés). Hecho en la v24.
3. **¿Algún personaje nuevo?** Sí: Don Jairo, el vigilante de la entrada.
   Hecho en la v24.
4. **Estilo de los retratos dibujados:** definido en la fase 3 (15 retratos) y
   mantenido para Don Jairo (5 más).
