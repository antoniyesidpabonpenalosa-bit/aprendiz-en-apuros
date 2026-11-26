# Recetas: pedir ayuda a otras IAs

> Hecho el 2026-11-26. Complementa `AGENTS.md` (contexto y reglas) y `planes/crecimiento.md`
> (qué se quiere construir). Todo lo que venga de otra IA es una **propuesta**: entra en su rama y
> pasa las comprobaciones y una revisión antes de llegar a `main`.

## Qué IA para qué

| Tarea | Con qué | Cómo entra al juego |
|---|---|---|
| **Arte nuevo**: personajes, fondos, objetos | ChatGPT (imágenes) o Gemini. Así se hicieron los retratos (`planes/pasillo.md`) y el jefe (`planes/jefe-evolutivo.md`) | La fuente va a `arte/`; lo que usa el juego, a `img/`, con los scripts `scripts/build-*` |
| **Preguntas y bancos de contenido** | cualquier modelo de texto (ChatGPT, Gemini, Claude) | En `js/datos.js`, **siempre al final** de cada lista (ver abajo) |
| **Diálogos e historia** | cualquier modelo de texto, con la guía de tono de abajo | En `DIALOGOS`, `INTRO`, `FINAL`… de `js/datos.js`, en ES y EN |
| **Código** | Claude Code, Codex, Gemini CLI o Cursor: todos leen `AGENTS.md` | En una rama, con su prueba y las comprobaciones de `AGENTS.md` |
| **Voz para el tráiler** (opcional) | ElevenLabs | Solo en el tráiler: hoy el juego no tiene voces |
| **Música del tráiler** (opcional) | cualquier generador cuya licencia permita uso comercial | Solo en el tráiler: la música del juego se toca con código (`js/audio.js`) |

**Antes de pedir nada:** pega `AGENTS.md` y el plan que toque. La IA trabaja mucho mejor con el
contexto completo que con una frase suelta.

## Regla de oro de los bancos: solo se añade al final

El juego recuerda qué ítems fallas **por su posición** en la lista (`S.pesos`, claves como
`quiz:12` en `js/reto.js`). Lo mismo usan el repaso y el panel del instructor. Por eso:
- **Nunca se reordena, se inserta en medio ni se borra un ítem.** Si uno está mal, se corrige en su
  sitio.
- En `QUIZ`, la lista `es` y la lista `en` van **en paralelo**: el ítem 12 en español es el ítem 12
  en inglés, con las opciones en el mismo orden y la misma `r` (la respuesta correcta).

## Prompts listos

Cambia lo que va entre `<>`. Todos piden el formato exacto que lee el juego.

### 1. Preguntas del quiz y de las salas en vivo (`QUIZ`)

```text
Eres instructor del SENA (Colombia), del técnico en Programación de Software. Escribe <20>
preguntas nuevas de opción múltiple sobre <tema: Git / HTML / JavaScript / bases de datos / buenas
prácticas>, para aprendices principiantes.
Reglas:
- 3 opciones por pregunta: 1 correcta y 2 incorrectas creíbles. Puede haber una incorrecta con
  humor de oficina, pero nunca dos.
- La pregunta, de 40 caracteres como máximo; cada opción, de 60 como máximo (es lo que
  usan las que ya existen y cabe en el celular).
- Que la correcta no caiga siempre en la misma posición.
- Devuelve DOS listas en paralelo, en este formato JavaScript exacto (misma posición = misma
  pregunta, mismas opciones en el mismo orden y la misma r):
  es: {q:'¿…?',o:['…','…','…'],r:<0|1|2>},
  en: {q:'…?',o:['…','…','…'],r:<0|1|2>},
- No repitas estas preguntas que ya existen: <pega QUIZ.es actual>.
```

### 2. Consultas SQL para ordenar (`SQLS`)

```text
Escribe <15> consultas SQL sencillas, cada una partida en sus cláusulas EN ORDEN CORRECTO, en este
formato JavaScript exacto: ['SELECT nombre','FROM aprendices','WHERE nota >= 3','ORDER BY nombre'],
- De 2 a 4 piezas cada una (como las que ya existen); temas de un centro de formación o de una empresa de software.
- Que no haya dos piezas que puedan ir en el mismo lugar (el orden correcto tiene que ser único).
- Comillas dobles dentro del SQL, como en "admin".
```

### 3. Patrones de regex (`REGEXS`)

```text
Escribe <10> retos de expresiones regulares para principiantes, en este formato JavaScript exacto:
{p:'^git', des:'empieza por "git"', den:'starts with "git"', opts:['git push','git status','digit','legit','git!','agitar']},
- p: la expresión (con las barras invertidas escapadas para JavaScript, como '\\.js$').
- des/den: qué cumple, en español y en inglés, en menos de 30 caracteres.
- opts: 6 textos cortos; entre 2 y 4 deben cumplir el patrón y el resto no. Incluye al menos una
  trampa que casi cumple.
- Comprueba cada opción ejecutando la expresión antes de responder.
```

### 4. Conflictos de merge (`CONFLICTOS`) y code review (`CODIGO`)

```text
Escribe <15> pares para un minijuego de conflictos de Git, en este formato exacto:
['const total = a + b;','const total = a ++ b;'],
El primero es la línea correcta y el segundo la rota, con un solo error de sintaxis o de lógica
que un principiante pueda ver. Una línea de JavaScript de 40 caracteres como máximo.

Y <15> líneas para un code review: {c:'for(let i=0; i<10; i++){ }',ok:1},
(ok:1 si está bien, ok:0 si tiene un error). Más o menos la mitad de cada tipo.
```

### 5. Comandos de terminal (`TERMINALES`)

```text
Escribe <10> tareas de terminal o Git para principiantes, en este formato exacto:
{es:'Clona el repositorio remoto', en:'Clone the remote repository', cmd:'git clone'},
- cmd: el comando corto que se escribe, sin argumentos inventados.
- es/en: la tarea en menos de 40 caracteres.
```

### 6. Diálogos e historia

```text
Guía de tono para el juego «Aprendiz en apuros»:
- Español de Colombia, cercano y con humor de oficina, sin groserías. Frases de 66 a 110
  caracteres (es lo que cabe en la caja de diálogo).
- Personajes: GUSTAVO (instructor, lectiva: paciente, da la tarea del día), VALENTINA (compañera de
  ficha: cómplice, da trucos), ANDRÉS (líder técnico, productiva: directo, habla de producción),
  DON JAIRO (vigilante: sabe todo lo que pasa en el centro).
- Etapa lectiva (días 1-10): se APRENDE en el centro de formación. Etapa productiva (11-15): se
  TRABAJA en una empresa.
Tarea: <por ejemplo, escribe la decisión del día 3: una pregunta de Valentina con dos respuestas y
la reacción de cada una>. Da cada línea en español y en inglés, en el formato
['NOMBRE · CARGO','texto'].
```

### 7. Arte: personajes que salgan iguales en todas las imágenes

Es el método que ya funcionó con los retratos (`planes/pasillo.md`, «Retratos dibujados»):
1. **Primero una hoja de personaje:** frente, tres cuartos y las cinco expresiones (normal, feliz,
   enojado, sorprendido y preocupado), en una sola imagen.
2. **Cada imagen siguiente se pide pasando esa hoja como referencia**, con el mismo prompt base y la
   misma paleta.
3. **Formatos que ya usa el juego** (`README.md`, «Estructura»):
   - sprites de cuerpo entero en celdas de 44×74;
   - jefe en poses de 128×128;
   - fondos de cine de 1200×300;
   - campus de la portada de 1600×900;
   - retratos en WebP.
   Fondo transparente en los sprites; pixel art sin suavizado.
4. **El arte de pixel se revisa a tamaño real** (×1 y ×2) antes de entrar. Ya hubo que limpiar
   píxeles sueltos fuera de paleta (v40.21).

```text
Pixel art de 32 bits para un juego retro sobre un aprendiz de programación del SENA (Colombia).
<Qué: por ejemplo, la cafetería del centro de formación vista desde arriba, de 320×180>.
Paleta limitada de <16> colores, sin degradados suaves ni antialiasing, contornos de 1 píxel.
Luz cálida de interior. Sin texto dentro de la imagen (los letreros los pone el juego, porque se
traducen). Estilo coherente con la referencia adjunta.
```

## Cómo entra lo que devuelve la IA

1. **Pega el resultado** en una conversación con Claude Code (o en tu herramienta), en una rama
   nueva.
2. **Revisa lo que la IA no ve:** que no esté repetido, que la respuesta sea de verdad la correcta,
   que quepa en pantalla y que el inglés sea natural.
3. **Pasa las comprobaciones de `AGENTS.md`.** Si es contenido, juega ese minijuego en ES y EN y en
   el celular.
4. **Sube la versión** (número pequeño) con su NOVEDAD en los dos idiomas.
