# Licencias de lo que no es del juego

El juego es propio y no lleva dependencias, con una excepción: el código de
`js/pixelfx.js`, que viene de otros proyectos con licencia MIT. La licencia exige
conservar los avisos de copyright y el texto del permiso, y este archivo es ese
lugar. (Las fuentes `fuentes/press-start-2p.woff2` y `fuentes/vt323.woff2` tienen
su propia licencia, aparte.)

## pixelfx — js/pixelfx.js

Biblioteca de efectos de pixel art como código: https://github.com/patch-gg/pixelfx
Se empaquetó la versión indicada en la cabecera de `js/pixelfx.js` con
`scripts/build-pixelfx.mjs`. Solo van dentro el motor y tres efectos
(`ui/heart-lost`, `ui/level-up` y `ui/combo-counter`); no se modificó su código.

```
MIT License

Copyright (c) 2026 Patch
Copyright (c) 2026 Hugo Duprez

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### Avisos que trae pixelfx (su `NOTICE.md`)

- **Hugo Duprez.** `src/core/sim.js` y los efectos que lo dicen al principio de
  su archivo adaptan los efectos de pixel art de código abierto de Sprite Fusion
  (https://www.spritefusion.com/pixel-art-vfx), Copyright (c) 2026 Hugo Duprez,
  licencia MIT. Aquí lo usan `ui/level-up` y `ui/combo-counter`.
- **Hollow Crown.** `src/core/act.js` adapta cómo Hollow Crown reproduce sus
  habilidades (https://github.com/rehan-remade/hollow-crown), Copyright (c) 2026
  rehan-remade, licencia MIT. Va dentro del paquete porque el motor lo importa,
  aunque el juego no usa sus personajes.
- **Patch Pixel.** La tipografía de la galería de pixelfx es de Patch y NO está
  cubierta por la licencia MIT. No se incluye en este juego.

## Claude Code Game Studios — ideas, sin código copiado

Las tres skills de `.claude/skills/` (`balance`, `playtest` y `terminar`) parten de las ideas
de `/balance-check`, `/playtest-report` y `/cut` de
https://github.com/Donchitos/Claude-Code-Game-Studios (licencia MIT, Copyright (c) 2026
Donchitos). Están escritas de nuevo para este juego y no copian su texto ni sus scripts; se
cita por cortesía y para que se sepa de dónde salió la idea.
