#!/usr/bin/env node
/* Repinta la CARA de los atlas de cuerpo entero para que coincida con los retratos (v40.6).
     node scripts/build-caras-cuerpo.mjs
   Corre DESPUÉS de scripts/build-aprendiz-masculino.py. Es idempotente: solo repinta el interior de la
   cara (la piel y lo que hay dentro: ojos, cejas, nariz, boca, barba). No toca la silueta, el pelo, las
   orejas, el contorno, el cuerpo, los pies ni el anclaje, y usa los tonos exactos de piel del juego para
   que las 16 combinaciones de piel y camisa sigan funcionando.

   Atlas de caminata: 176×592 (4 pasos × 8 direcciones, celdas de 44×74). Portada: 176×74 (4 poses). */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { decodificarPNG, codificarPNG, hex, rgbDe } from './lib-pixel.mjs';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const FW = 44, FH = 74;
export const PIEL = ['#915231', '#bb7448', '#d99663', '#efb67d', '#facc99', '#ffe1b7'];
const esPielRampa = c => PIEL.includes(c);

/* ── acceso a una celda ── */
class Celda {
  constructor(atlas, fila, col) { this.a = atlas; this.fila = fila; this.col = col; }
  get(x, y) { if (x < 0 || y < 0 || x >= FW || y >= FH) return null; const i = ((this.fila * FH + y) * this.a.w + this.col * FW + x) * 4; return this.a.rgba[i + 3] ? hex(this.a.rgba[i], this.a.rgba[i + 1], this.a.rgba[i + 2]) : null; }
  p(x, y, c) { if (x < 0 || y < 0 || x >= FW || y >= FH) return; const i = ((this.fila * FH + y) * this.a.w + this.col * FW + x) * 4; if (c === null) { this.a.rgba[i + 3] = 0; return; } const [r, g, b] = rgbDe(c); this.a.rgba[i] = r; this.a.rgba[i + 1] = g; this.a.rgba[i + 2] = b; this.a.rgba[i + 3] = 255; }
}

/** Interior de la cara: píxeles de piel (rampa exacta) y los huecos cerrados entre ellos (ojos, boca, barba), solo en las filas de la cabeza. */
function mascaraCara(c, yMax = 31) {
  const piel = new Set(); let x0 = 99, x1 = -1, y0 = 99, y1 = -1;
  for (let y = 0; y <= yMax; y++) for (let x = 0; x < FW; x++) if (esPielRampa(c.get(x, y))) { piel.add(y * FW + x); x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  const dentro = new Set(piel);
  const hay = (x, y, dx, dy, max) => { for (let k = 1; k <= max; k++) if (piel.has((y + dy * k) * FW + x + dx * k)) return true; return false; };
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { if (piel.has(y * FW + x) || !c.get(x, y)) continue;
    if (hay(x, y, -1, 0, 9) && hay(x, y, 1, 0, 9) && hay(x, y, 0, -1, 9) && hay(x, y, 0, 1, 9)) dentro.add(y * FW + x); }
  return { dentro, x0, x1, y0, y1 };
}

/* ── colores de los rasgos (los mismos que los retratos) ── */
const HM = ['#2a1912', '#46271a', '#6b3a21', '#91512b', '#ae683a', '#cf8d54'];
const BA = ['#1f130f', '#33201a', '#412619', '#58341f'];
const BLANCO = '#f7f4e9', OJO = '#171420', IRIS = '#33263a', LABIOM = '#c46a58', BOCAM = '#5a1f22', DIENTE = '#f7f4e9';
import { Lienzo } from './lib-pixel.mjs';

/** pinta, dentro de la máscara, el diseño D (si tiene color) o la piel de base con su sombra */
function aplica(c, mascara, D, pielBase) {
  for (const k of mascara.dentro) { const x = k % FW, y = Math.floor(k / FW); const col = D.get(x, y); c.p(x, y, col || pielBase(x, y)); }
}
const OJO48 = ['.KKKK.', 'WIhIIW', 'WIIIIW', '.WIIW.'];
function ojo(D, x, y, izq, filas = OJO48, oscuro = OJO, iris = IRIS) {
  const ancho = Math.max(...filas.map(f => f.length));
  filas.forEach((f, j) => [...f].forEach((ch, i) => { if (ch === '.') return; const xx = x + (izq ? i : ancho - 1 - i);
    D.p(xx, y + j, ch === 'K' ? oscuro : ch === 'I' ? (j >= 2 ? iris : oscuro) : BLANCO); }));
}

/** Masculino, de frente (fila S) y su parpadeo/saludo en el atlas de portada: la cara es la misma en todos los cuadros. */
function caraMasculinaFrente(c, { parpadeo = false } = {}) {
  const m = mascaraCara(c, 28), D = new Lienzo(FW, FH);
  /* barba: laterales y mentón; el bigote y la boca van encima */
  D.poli([[10.5, 20], [13, 20], [14, 22.6], [17, 23.6], [22, 23], [27, 23.6], [30, 22.6], [31, 20], [33.5, 20], [33.5, 27], [31, 29.5], [22, 30.5], [13, 29.5], [10.5, 27]], BA[2]);
  for (const [x, y] of [[14, 25], [31, 25], [16, 27], [28, 27], [19, 28], [25, 28], [13, 22], [32, 22], [22, 28]]) D.p(x, y, BA[3]);
  for (const [x, y] of [[15, 24], [29, 24], [18, 26], [26, 26], [21, 27], [23, 27]]) D.p(x, y, BA[1]);
  /* cejas y ojos (los mismos del retrato de 48) */
  for (const [dx, dy] of [[1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [0, 1], [1, 1], [2, 1], [3, 1]]) { D.p(15 + dx - 1, 14 + dy, HM[1]); D.p(29 - (15 + dx - 1) + 15, 14 + dy, HM[1]); }
  for (const [dx, dy] of [[1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [0, 1], [1, 1], [2, 1], [3, 1]]) { /* espejo exacto respecto a la columna 22 */ }
  const caraOjo = (x, izq) => {
    if (parpadeo) { for (let i = 0; i < 6; i++) D.p(x + i, 20, OJO); D.p(x, 19, OJO); D.p(x + 5, 19, OJO); }
    else ojo(D, x, 17, izq);
  };
  caraOjo(14, true); caraOjo(25, false);
  /* nariz */
  D.p(21, 22, PIEL[3]); D.p(22, 22, PIEL[3]); D.p(23, 22, PIEL[3]); D.p(22, 21, PIEL[5]);
  /* bigote en dos alas, labio y boca */
  D.poli([[16.5, 24], [20, 22.6], [22.5, 23.6], [25, 22.6], [28.5, 24], [27, 25.8], [22.5, 25], [18, 25.8]], BA[0]);
  D.rect(20, 26, 5, 1, LABIOM); D.rect(20, 27, 5, 1, BOCAM); D.p(19, 26, BOCAM); D.p(25, 26, BOCAM);
  aplica(c, m, D, (x, y) => (x >= 31 ? PIEL[3] : PIEL[4]));
}
/** Dibuja con las coordenadas espejadas (para W y SW a partir de E y SE) */
class Espejo {
  constructor(D, m) { this.D = D; this.m = m; }
  x(x) { return this.m ? 43 - x : x; }
  p(x, y, c) { this.D.p(this.x(x), y, c); }
  rect(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.p(x + i, y + j, c); }
  poli(pts, c) { this.D.poli(pts.map(([x, y]) => [this.m ? 44 - x : x, y]), c); }
}
function ojoE(D, x, y, filas, ancho) {   // el ojo se dibuja de izquierda a derecha en el espacio «sin espejar»
  filas.forEach((f, j) => [...f].forEach((ch, i) => { if (ch === '.') return; D.p(x + i, y + j, ch === 'K' ? OJO : ch === 'I' ? (j >= 2 ? IRIS : OJO) : BLANCO); }));
}
const OJO5 = ['.KKK.', 'WIhIW', 'WIIIW', '.WIW.'], OJO4 = ['.KK.', 'WhIW', 'IIII', '.II.'];
function barbaTexto(D, pts) { for (const [x, y, c] of pts) D.p(x, y, c); }

/** Tres cuartos (SE, y SW espejada): la cara mira hacia la derecha del dibujo */
function cara34(c, espejo, { parpadeo = false } = {}) {
  const base = mascaraCara(c, 28), D = new Lienzo(FW, FH), E = new Espejo(D, espejo);
  const m = { dentro: new Set([...base.dentro].filter(k => { const x = k % FW; return (espejo ? 43 - x : x) >= 16; })) };
  E.poli([[16, 21], [18, 21], [19, 23.5], [24, 24.5], [31, 23.5], [32, 21], [33.5, 21], [33.5, 27], [31, 29.5], [24, 30.5], [18, 29], [16, 26]], BA[2]);
  barbaTexto(E, [[18, 25, BA[3]], [20, 28, BA[3]], [26, 28, BA[3]], [30, 26, BA[3]], [32, 24, BA[3]], [17, 23, BA[3]], [19, 26, BA[1]], [28, 27, BA[1]], [22, 29, BA[1]]]);
  for (const [dx, dy] of [[1, 0], [2, 0], [3, 0], [4, 0], [0, 1], [1, 1], [2, 1], [5, 1]]) E.p(19 + dx, 14 + dy, HM[1]);
  for (const [dx, dy] of [[1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [0, 1], [1, 1], [2, 1], [3, 1]]) E.p(27 + dx, 14 + dy, HM[1]);
  const pinta = (x, filas) => { if (parpadeo) { for (let i = 0; i < 5; i++) E.p(x + i, 20, OJO); E.p(x, 19, OJO); E.p(x + 4, 19, OJO); } else filas.forEach((f, j) => [...f].forEach((ch, i) => { if (ch !== '.') E.p(x + i, 17 + j, ch === 'K' ? OJO : ch === 'I' ? (j >= 2 ? IRIS : OJO) : BLANCO); })); };
  pinta(20, ['.KKK.', 'WIhIW', 'WIIIW', '.WIW.']); pinta(27, ['.KKKK', 'WIhII', 'WIIII', '.WIIW'].map(f => f.slice(0, 5)));
  E.p(25, 21, PIEL[3]); E.p(26, 21, PIEL[3]); E.p(26, 22, PIEL[2]); E.p(25, 20, PIEL[5]);
  E.poli([[21, 24], [24.5, 22.6], [26, 23.4], [29, 22.6], [31.5, 24], [30.5, 25.6], [26, 25], [22, 25.6]], BA[0]);
  E.rect(24, 26, 4, 1, LABIOM); E.rect(24, 27, 4, 1, BOCAM);
  aplica(c, m, D, (x, y) => ((espejo ? 43 - x : x) >= 31 ? PIEL[3] : PIEL[4]));
}

/** Perfil (E, y W espejada) */
function caraPerfil(c, espejo, { parpadeo = false } = {}) {
  const base = mascaraCara(c, 28), D = new Lienzo(FW, FH), E = new Espejo(D, espejo);
  const m = { dentro: new Set([...base.dentro].filter(k => { const x = k % FW; return (espejo ? 43 - x : x) >= 22; })) };
  E.poli([[22, 21], [25, 22.5], [29, 23], [33.5, 23.5], [33.5, 27.5], [31, 29.5], [25, 29.5], [22, 27]], BA[2]);
  barbaTexto(E, [[24, 24, BA[3]], [27, 26, BA[3]], [24, 27, BA[3]], [30, 27, BA[3]], [26, 22, BA[3]], [25, 25, BA[1]], [29, 26, BA[1]], [27, 28, BA[1]]]);
  for (const [dx, dy] of [[1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [0, 1], [1, 1], [2, 1], [3, 1]]) E.p(27 + dx - 1 + 1, 14 + dy, HM[1]);
  if (parpadeo) { for (let i = 0; i < 4; i++) E.p(28 + i, 20, OJO); E.p(28, 19, OJO); E.p(31, 19, OJO); }
  else ['.KK.', 'WhIW', 'WIIW', '.II.'].forEach((f, j) => [...f].forEach((ch, i) => { if (ch !== '.') E.p(28 + i, 17 + j, ch === 'K' ? OJO : ch === 'I' ? (j >= 2 ? IRIS : OJO) : BLANCO); }));
  E.p(32, 21, PIEL[3]); E.p(33, 21, PIEL[3]); E.p(32, 22, PIEL[2]);
  E.poli([[29.5, 23.2], [33.5, 23.6], [33.5, 25.4], [30, 25.6]], BA[0]);
  E.rect(30, 26, 3, 1, LABIOM); E.rect(30, 27, 3, 1, BOCAM);
  aplica(c, m, D, (x, y) => PIEL[4]);
}
export { caraMasculinaFrente, cara34, caraPerfil, Celda, mascaraCara };

/* ── atlas de caminata de ella: la columna 0 (reposo) era otro dibujo, con la cabeza más pequeña, y hacía «saltar» la
   cara en cada vuelta del ciclo. La columna 2 es la pose de PASO (los dos pies en el suelo): pasa a ser el reposo y el
   ciclo queda como una caminata normal: paso, zancada A, paso, zancada B. ── */
function reposoFemenino(a) {
  for (let fila = 0; fila < 8; fila++) for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) {
    const o = ((fila * FH + y) * a.w + 0 * FW + x) * 4, s = ((fila * FH + y) * a.w + 2 * FW + x) * 4;
    for (let k = 0; k < 4; k++) a.rgba[o + k] = a.rgba[s + k]; }
}

function aplicarMasculino(caminar, portada) {
  for (let col = 0; col < 4; col++) { caraMasculinaFrente(new Celda(caminar, 0, col)); cara34(new Celda(caminar, 1, col), false); caraPerfil(new Celda(caminar, 2, col), false); caraPerfil(new Celda(caminar, 6, col), true); cara34(new Celda(caminar, 7, col), true); }
  for (let pose = 0; pose < 4; pose++) caraMasculinaFrente(new Celda(portada, 0, pose), { parpadeo: pose === 1 });
}

/* ── ejecución ── */
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const modo = process.argv[2] || 'escribir', salida = process.argv[3];
  const rm = join(RAIZ, 'img/aprendiz-masculino-premium-caminar.png'), rp = join(RAIZ, 'img/aprendiz-masculino-premium-portada.png'), rf = join(RAIZ, 'img/aprendiz-femenina-caminar.png');
  const m = decodificarPNG(readFileSync(rm)), p = decodificarPNG(readFileSync(rp)), f = decodificarPNG(readFileSync(rf));
  aplicarMasculino(m, p); reposoFemenino(f);
  if (modo === 'prueba') { for (const [n, a] of [['m', m], ['p', p], ['f', f]]) writeFileSync(join(salida, `prueba-${n}.png`), codificarPNG(a.w, a.h, a.rgba)); }
  else { writeFileSync(rm, codificarPNG(m.w, m.h, m.rgba)); writeFileSync(rp, codificarPNG(p.w, p.h, p.rgba)); writeFileSync(rf, codificarPNG(f.w, f.h, f.rgba)); console.log('ok: caras del cuerpo repintadas'); }
}
