#!/usr/bin/env node
/* Completa el ciclo de caminata de ELLA con el arte del propio atlas (v40.15). Sin IA, sin dependencias.
     node scripts/build-ciclo-femenino.mjs            (reescribe img/aprendiz-femenina-caminar.png)
     node scripts/build-ciclo-femenino.mjs prueba DIR (escribe DIR/prueba-ciclo.png y no toca nada)

   Problema: desde v40.6 el cuadro 0 era una copia del 2 (la pose de paso), así que el ciclo repetía el mismo paso, con el
   mismo pie levantado, y de frente (S, SE) las dos zancadas elevaban también el mismo pie: ella «cojeaba».
   Solución: un paso y una zancada con el OTRO pie. La mitad de arriba (cabeza, pelo, hombros) no se toca, así que los
   anclajes de gafas, audífonos, gorra y corona siguen valiendo; desde una fila de corte hacia abajo (tronco bajo, brazos,
   manos y piernas) se usa la mitad de abajo en ESPEJO de otra celda del propio atlas: la misma de frente y de espaldas
   (S, N) y la de la dirección pareja en los tres cuartos (SE con SO, NE con NO). Un espejo de la misma vista, nunca de
   otra: la espalda no sale de un frente volteado. El corte se elige entre las filas del pecho donde la costura encaja mejor.

   Corre DESPUÉS de scripts/build-caras-cuerpo.mjs (que copia el cuadro 2 en el 0). Es idempotente: solo escribe el cuadro 0 de todas las direcciones menos el perfil y, de frente (S), el cuadro 3 (que allí
   repetía el mismo pie que el 1), y los saca de celdas que no toca (los cuadros 1 y 2). El perfil (E, O) se deja como está:
   allí las dos piernas son del mismo color y el ciclo ya se lee; en los tres cuartos la zancada ya alterna lo bastante. */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { decodificarPNG, codificarPNG } from './lib-pixel.mjs';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const FW = 44, FH = 74;
const S = 0, SE = 1, E = 2, NE = 3, N = 4, NO = 5, O = 6, SO = 7;
/* [fila destino, columna destino, [fila base, col base] (de donde sale la mitad de arriba), [fila fuente, col fuente] (la de abajo, en espejo),
    fila de corte]. Los cortes están fijos (salen de `node scripts/build-ciclo-femenino.mjs cortes` sobre el atlas de v40.14: la fila
   del pecho donde la costura desentona menos) para que volver a correr el script dé el mismo resultado aunque el cuadro 3 de S ya esté tocado. */
export const RECETAS = [
  [S, 0, [S, 2], [S, 2], 41], [S, 3, [S, 3], [S, 1], 38],
  [SE, 0, [SE, 2], [SO, 2], 43], [NE, 0, [NE, 2], [NO, 2], 44],
  [N, 0, [N, 2], [N, 2], 42],
  [SO, 0, [SO, 2], [SE, 2], 39],
  [NO, 0, [NO, 2], [NE, 2], 44],
];
export const CORTE_MIN = 34, CORTE_MAX = 44;

const idx = (a, f, c, x, y) => ((f * FH + y) * a.w + c * FW + x) * 4;
const opaco = (a, f, c, x, y) => x >= 0 && x < FW && a.rgba[idx(a, f, c, x, y) + 3] > 0;
function centro(a, f, c, y) { let x0 = 99, x1 = -1; for (let x = 0; x < FW; x++) if (opaco(a, f, c, x, y)) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); } return x1 < 0 ? null : (x0 + x1) / 2; }

/** índice del píxel de la fuente que cae en (x,y) de la celda destino al reflejar la mitad de abajo, o -1 */
function origenEspejo(a, base, fuente, yc, x, y) {
  /* el eje es el del cuerpo justo ENCIMA del corte (esa fila no cambia), así el resultado no depende de lo que ya se haya escrito abajo */
  const cxb = centro(a, base[0], base[1], yc - 1), cxs = centro(a, fuente[0], fuente[1], yc - 1);
  const xs = Math.round(cxs + (cxb - x));
  return xs >= 0 && xs < FW ? idx(a, fuente[0], fuente[1], xs, y) : -1;
}
/** cuánto desentona la costura: color de la fila de arriba (de la base) contra la de abajo (de la fuente reflejada), y huecos que no casan */
function desajuste(a, base, fuente, yc) {
  let d = 0;
  for (let x = 0; x < FW; x++) {
    const p = idx(a, base[0], base[1], x, yc - 1), q = origenEspejo(a, base, fuente, yc, x, yc);
    const A = a.rgba[p + 3] > 0, B = q >= 0 && a.rgba[q + 3] > 0;
    if (A !== B) { d += 300; continue; } if (!A) continue;
    for (let k = 0; k < 3; k++) d += Math.abs(a.rgba[p + k] - a.rgba[q + k]);
  }
  return d;
}
export function mejorCorte(a, base, fuente) {
  let mejor = [Infinity, 38];
  for (let yc = CORTE_MIN; yc <= CORTE_MAX; yc++) { const d = desajuste(a, base, fuente, yc) + Math.abs(yc - 38); if (d < mejor[0]) mejor = [d, yc]; }
  return mejor[1];
}

export function aplica(a) {
  const fuentesIntactas = Buffer.from(a.rgba), salida = [];
  const ref = { w: a.w, rgba: fuentesIntactas };
  for (const [fd, cd, base, fuente, yc] of RECETAS) {
    salida.push({ fila: fd, col: cd, corte: yc });
    for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) {
      const s = y < yc ? idx(ref, base[0], base[1], x, y) : origenEspejo(ref, base, fuente, yc, x, y), o = idx(a, fd, cd, x, y);
      if (s < 0) { a.rgba[o + 3] = 0; continue; }
      for (let k = 0; k < 4; k++) a.rgba[o + k] = fuentesIntactas[s + k];
    }
  }
  return salida;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const ruta = join(RAIZ, 'img/aprendiz-femenina-caminar.png'), a = decodificarPNG(readFileSync(ruta));
  if (process.argv[2] === 'cortes') { for (const [fd, cd, base, fuente] of RECETAS) console.log(fd, cd, mejorCorte(a, base, fuente)); process.exit(0); }
  const cortes = aplica(a);
  if (process.argv[2] === 'prueba') { writeFileSync(join(process.argv[3], 'prueba-ciclo.png'), codificarPNG(a.w, a.h, a.rgba)); console.log(JSON.stringify(cortes)); }
  else { writeFileSync(ruta, codificarPNG(a.w, a.h, a.rgba)); console.log('ok: ciclo femenino completado', JSON.stringify(cortes)); }
}
