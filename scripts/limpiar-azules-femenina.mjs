/* Limpia los píxeles azules sueltos de la camisa de la protagonista (v40.21).

   El recoloreo de camisa de los atlas "de paleta exacta" solo cambia los seis tonos
   de azul de PALETA. En el atlas femenino había además ~20 píxeles por cuadro de
   azules cercanos (sombras y bordes del sombreado) que NO están en la paleta, así que
   se quedaban azules con cualquier camisa y se veían como puntitos sueltos.

   Este script los lleva al tono de la paleta con el brillo más parecido, solo en la
   zona de la camisa (filas 27 a 44 de cada cuadro de 44×74). No toca el pelo, el
   elástico, la piel, los jeans ni el contorno. Es idempotente: si ya está limpio, no cambia nada.

   Uso:  node scripts/limpiar-azules-femenina.mjs            (reescribe los dos atlas)
         node scripts/limpiar-azules-femenina.mjs --check    (no escribe; sale con 1 si queda alguno) */
import { readFileSync, writeFileSync } from 'node:fs';
import { decodificarPNG, codificarPNG } from './lib-pixel.mjs';

const RAIZ = new URL('..', import.meta.url).pathname;
const ATLAS = ['img/aprendiz-femenina-caminar.png', 'img/aprendiz-femenina-portada.png'];
const PALETA = [[16, 47, 91], [20, 67, 116], [23, 87, 143], [32, 110, 171], [54, 137, 195], [86, 165, 217]];
const FH = 74, Y0 = 27, Y1 = 44;
const lum = (r, g, b) => 0.3 * r + 0.59 * g + 0.11 * b;
const esPaleta = (r, g, b) => PALETA.some(p => p[0] === r && p[1] === g && p[2] === b);
/* mismo criterio con el que se detectan: azul visible, no contorno ni neutro */
const esSuelto = (r, g, b, a) => a > 200 && b >= 45 && b - r >= 10 && b >= g - 5 && !esPaleta(r, g, b);
const masCercano = (r, g, b) => { const l = lum(r, g, b); return PALETA.reduce((m, p) => Math.abs(lum(...p) - l) < Math.abs(lum(...m) - l) ? p : m); };

const soloComprobar = process.argv.includes('--check');
let quedan = 0;
for (const ruta of ATLAS) {
  const { w, h, rgba } = decodificarPNG(readFileSync(RAIZ + ruta));
  let n = 0;
  for (let y = 0; y < h; y++) {
    const dentro = y % FH;
    if (dentro < Y0 || dentro > Y1) continue;
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (!esSuelto(rgba[i], rgba[i + 1], rgba[i + 2], rgba[i + 3])) continue;
      n++;
      if (!soloComprobar) { const p = masCercano(rgba[i], rgba[i + 1], rgba[i + 2]); rgba[i] = p[0]; rgba[i + 1] = p[1]; rgba[i + 2] = p[2]; }
    }
  }
  if (soloComprobar) quedan += n;
  else if (n) writeFileSync(RAIZ + ruta, codificarPNG(w, h, rgba));
  console.log(`${ruta}: ${n} píxeles ${soloComprobar ? 'sueltos' : 'llevados a la paleta'}`);
}
if (soloComprobar && quedan) { console.error(`✗ quedan ${quedan} píxeles azules sueltos en la camisa femenina`); process.exit(1); }
if (soloComprobar) console.log('✓ la camisa femenina no tiene azules sueltos');
