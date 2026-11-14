# Personajes del pasillo de cuerpo entero (v38)

Paquete del autor (diseño de ChatGPT), a partir de la dirección artística de los 20 retratos
(`img/retratos/`, que no cambian). Recurso de producción: `img/npc/pasillo.png`, RGBA de 176×74,
4 celdas de 44×74 en este orden: instructor (Gustavo), companera (Valentina), lider (Andrés),
vigilante (Don Jairo). Pies en la fila 72, ancla abajo al centro (22,73); sin recoloreo.

Son poses frontales quietas (los personajes no caminan). `js/npc-sprites.js` (`NPC_PASILLO.dibujar`)
los pinta; si el atlas no carga, `js/pasillo.js` vuelve al cuerpo del aprendiz con la piel y la
camisa de cada uno (`js/consejos.js`), y si tampoco, al dibujo de rectángulos.

Nota del paquete: Gustavo y Andrés llevan algo más de barba que en sus retratos.
`manifest.json` y `sprites/` (las celdas sueltas) van aquí como fuente.
