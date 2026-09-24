'use strict';
/* ── SPRITE DEL APRENDIZ (cuerpo entero) ──
   El único recurso de imagen del juego: un atlas (img/aprendiz.png) con las 8
   direcciones del aprendiz en pixel art. El resto del juego se sigue dibujando
   con código, así que si el PNG no carga (sin conexión la primera vez, o
   bloqueado) todo lo que usa el sprite cae a su dibujo de respaldo y el juego
   funciona igual.

   El atlas lo genera scripts/build-sprite.py desde arte/aprendiz/. FW/FH y el
   orden de DIRS tienen que coincidir con ese script.

   Recoloreado: el sprite viene con una piel y una camisa fijas; aquí se
   remapean a las que eligió el jugador (SKINS[S.skin]/CAMISAS[S.camisa]), para
   no perder la personalización que ya tienen el runner y el jefe. Se cachea por
   combinación (solo hay 4×4), calculando cada una una sola vez. */

const APRENDIZ = (() => {
  const DIRS = ['south', 'south-east', 'east', 'north-east', 'north', 'north-west', 'west', 'south-west'];
  const FW = 44, FH = 74;                       // tamaño de cada cuadro en el atlas
  const idx = {}; DIRS.forEach((d, i) => idx[d] = i);

  /* Colores base del sprite (paleta del atlas): la camisa azul y la piel clara.
     El recoloreo toca solo los píxeles cercanos a estos, así el pelo, los
     jeans y el contorno se quedan como están. */
  const SHIRT = [0x17, 0x68, 0x9d], SKIN = [0xf5, 0xcb, 0x9a];
  const TOL2 = 70 * 70;                          // radio² de color para considerar "camisa"/"piel"
  const lum = (r, g, b) => 0.3 * r + 0.59 * g + 0.11 * b;
  const LSHIRT = lum(...SHIRT), LSKIN = lum(...SKIN);
  const dist2 = (r, g, b, c) => { const a = r - c[0], d = g - c[1], e = b - c[2]; return a * a + d * d + e * e; };
  const hexRGB = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

  let listo = false;
  const img = new Image();
  img.onload = () => { listo = true; };
  img.src = 'img/aprendiz.png';

  /* Atlas recoloreado a (skin,camisa). Multiplica el color destino por el brillo
     relativo de cada píxel, así conserva el sombreado del sprite. */
  const cache = new Map();
  function atlasDe(s, c) {
    const clave = s + ':' + c;
    let cv = cache.get(clave);
    if (cv) return cv;
    cv = document.createElement('canvas');
    cv.width = img.width; cv.height = img.height;
    const cx = cv.getContext('2d');
    cx.drawImage(img, 0, 0);
    const camisa = hexRGB(CAMISAS[c] || CAMISAS[0]);
    const piel = hexRGB(SKINS[s] || SKINS[0]);
    const d = cx.getImageData(0, 0, cv.width, cv.height), px = d.data;
    for (let i = 0; i < px.length; i += 4) {
      if (px[i + 3] === 0) continue;
      const r = px[i], g = px[i + 1], b = px[i + 2];
      if (dist2(r, g, b, SHIRT) < TOL2) { const k = lum(r, g, b) / LSHIRT;
        px[i] = Math.min(255, camisa[0] * k); px[i + 1] = Math.min(255, camisa[1] * k); px[i + 2] = Math.min(255, camisa[2] * k);
      } else if (dist2(r, g, b, SKIN) < TOL2) { const k = lum(r, g, b) / LSKIN;
        px[i] = Math.min(255, piel[0] * k); px[i + 1] = Math.min(255, piel[1] * k); px[i + 2] = Math.min(255, piel[2] * k);
      }
    }
    cx.putImageData(d, 0, 0);
    cache.set(clave, cv);
    return cv;
  }

  /* Dirección a la que mira según el movimiento (dx,dy en px; dy hacia abajo,
     como el canvas). Sin movimiento mira de frente (sur). */
  function dirDe(dx, dy) {
    if (!dx && !dy) return idx.south;
    const oct = ((Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) % 8) + 8) % 8;
    // 0=E, 1=SE, 2=S, 3=SW, 4=W, 5=NW, 6=N, 7=NE
    return [idx.east, idx['south-east'], idx.south, idx['south-west'], idx.west, idx['north-west'], idx.north, idx['north-east']][oct];
  }

  /* Pinta el cuadro `dir` centrado en x, con el PIE en yPie y ese alto lógico.
     Devuelve false si el atlas aún no cargó (quien llama pinta su respaldo). */
  function dibujar(ctx, x, yPie, alto, dir, s = S.skin, c = S.camisa) {
    if (!listo) return false;
    const cv = atlasDe(s, c);
    const w = Math.round(alto * FW / FH);
    const antes = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(cv, dir * FW, 0, FW, FH, Math.round(x - w / 2), Math.round(yPie - alto), w, alto);
    ctx.imageSmoothingEnabled = antes;
    return true;
  }

  return { DIRS, idx, FW, FH, dirDe, dibujar, atlasDe, get listo() { return listo; } };
})();
