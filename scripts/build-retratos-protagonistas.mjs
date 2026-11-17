#!/usr/bin/env node
/* Genera los retratos de los dos protagonistas.   node scripts/build-retratos-protagonistas.mjs
   (sustituye al generador de Python de v40.2: aquel recortaba el atlas del cuerpo y lo reducía.)

   Cómo se dibuja cada retrato, a 16×16, 32×32 y 48×48 (bustos de cine):
   · Las FORMAS grandes (hombros, pelo, cara, barba, coleta) salen de los mismos polígonos y se
     rasterizan DIRECTAMENTE a la resolución de cada tamaño: así la identidad no cambia entre tamaños.
   · Los RASGOS pequeños (ojos, cejas, nariz, boca) se dibujan a mano, píxel a píxel, para cada
     tamaño y cada gesto, con su propio mapa. Nada se reduce desde otro tamaño.
   · Cinco gestos (normal, feliz, enojado, sorprendido, preocupado), cada uno con su parpadeo.
   · Los colores de piel (6 tonos) y de camisa (6 tonos) son los de las rampas del juego: en
     ejecución se sustituyen por los SKINS y CAMISAS elegidos. Pelo, ojos, barba y labios no cambian.
   Salida: js/retratos-aprendiz-arte.js (datos) y arte/retratos-protagonistas/ (hojas de revisión). */
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Lienzo, hoja, codificarPNG } from './lib-pixel.mjs';
import { accesorio, IDS as ACC_IDS } from './lib-accesorios-retrato.mjs';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
export const PIEL = ['#915231', '#bb7448', '#d99663', '#efb67d', '#facc99', '#ffe1b7'];
export const CAM = ['#102f5b', '#144374', '#17578f', '#206eab', '#3689c3', '#56a5d9'];
const HM = ['#2a1912', '#46271a', '#6b3a21', '#91512b', '#ae683a', '#cf8d54'];   // pelo de él
const BA = ['#1f130f', '#33201a', '#412619', '#58341f'];                           // barba (más oscura que el pelo)
const HF = ['#331b13', '#5a2d1b', '#8b4524', '#af562b', '#cf7436', '#ee9a55'];   // pelo de ella
const BLANCO = '#f7f4e9', OJO = '#171420', IRIS = '#33263a', IRISF = '#4b2b22', OJOF = '#1b1118';
const LABIOM = '#c46a58', BOCAM = '#5a1f22', LABIO1 = '#b9505e', LABIO2 = '#e18391', BOCAF = '#6a2230', LENGUA = '#e0707d', CLIP = '#b8c2d8';
const esPiel = c => PIEL.includes(c);
const esPeloM = c => HM.includes(c) || BA.includes(c);
const esPeloF = c => HF.includes(c);
export const GESTOS = ['normal', 'feliz', 'enojado', 'sorprendido', 'preocupado'];
export const TAMANOS = [16, 32, 48];
const KESC = { 48: 1, 32: 2 / 3, 16: 1 / 3 };

/** Pincel que trabaja en coordenadas «de 48» y rasteriza a la resolución k */
class Esc {
  constructor(P, k) { this.P = P; this.k = k; }
  poli(pts, c) { this.P.poli(pts.map(([x, y]) => [x * this.k, y * this.k]), c); }
  rect(x, y, w, h, c) { this.poli([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], c); }
  elipse(cx, cy, rx, ry, c) { this.P.elipse(cx * this.k, cy * this.k, rx * this.k, ry * this.k, c); }
  linea(pts, c) { for (let i = 0; i + 1 < pts.length; i++) this.P.linea(pts[i][0] * this.k, pts[i][1] * this.k, pts[i + 1][0] * this.k, pts[i + 1][1] * this.k, c); }
}

/* ───────────────────────── ÉL ───────────────────────── */
function formaM(P, n) {
  const k = KESC[n], E = new Esc(P, k);
  E.poli([[3, 48], [4, 43], [9, 39], [17, 37], [31, 37], [39, 39], [44, 43], [45, 48]], CAM[3]);
  E.poli([[32, 38], [39, 40], [44, 44], [45, 48], [35, 48], [34, 43]], CAM[2]);
  E.poli([[3, 48], [4, 44], [8, 41], [10, 42], [8, 48]], CAM[4]);
  E.rect(18, 33, 12, 6, PIEL[2]);
  E.poli([[18, 38], [30, 38], [24, 45]], '#0d1830');
  E.poli([[13, 37], [19, 37], [24, 45], [20, 46], [11, 41]], CAM[5]);
  E.poli([[35, 37], [29, 37], [24, 45], [28, 46], [37, 41]], CAM[4]);
  if (n >= 32) { E.linea([[19, 38], [24, 44]], CAM[2]); E.linea([[29, 38], [24, 44]], CAM[1]); }
  if (n === 48) { P.p(24, 41, '#9bd0f2'); P.p(24, 44, '#9bd0f2'); }
  E.poli([[9.5, 24], [8, 17], [9, 11], [12.5, 6.5], [17, 3.5], [21, 2.5], [24.5, 3.5], [28, 1.5], [32, 2.5], [36, 5.5], [39, 10], [40.5, 17], [38.5, 24]], HM[2]);
  for (const ox of [9.8, 38.2]) E.elipse(ox, 25.5, 2.2, 3, PIEL[3]);
  E.elipse(24, 24, 12.6, 11.6, PIEL[4]);
  sombraPiel(P, k, 24, 24, 12.6, 11.6);
  E.poli([[11.5, 22], [14, 22], [14.5, 26], [17.5, 27.5], [21, 26.8], [24, 27.6], [27, 26.8], [30.5, 27.5], [33.5, 26], [34, 22], [36.5, 22], [37, 28.5], [34.5, 33.5], [30, 37], [24, 38], [18, 37], [13.5, 33.5], [11, 28.5]], BA[2]);
  E.poli([[10.5, 23], [9, 16], [10, 11], [13, 7], [17, 4.5], [21, 3.5], [24.5, 4.5], [28, 2.5], [32, 3.5], [36, 6.5], [38.5, 11], [39.5, 17], [37.5, 23], [36.5, 18], [34, 14.5], [30, 12.5], [27, 13.5], [23.5, 12.5], [20, 13.5], [16, 14], [13.5, 17], [12, 20]], HM[2]);
  if (n >= 32) { /* mechones y brillos */
    E.linea([[13, 9], [16, 6], [20, 5], [24, 6]], HM[3]); E.linea([[17, 10], [21, 8], [25, 9], [29, 7]], HM[3]);
    E.linea([[26, 5], [29, 4], [33, 5], [36, 8]], HM[3]); E.linea([[30, 9], [33, 9], [36, 12]], HM[3]);
    E.linea([[15, 7], [18, 5.5], [22, 5.5]], HM[4]); E.linea([[27, 4], [30, 3.5], [33, 4.5]], HM[4]);
    E.linea([[10, 13], [10.5, 18]], HM[1]); E.linea([[38, 13], [38, 19]], HM[1]);
    E.linea([[14, 15], [17, 13.5], [21, 13.5]], HM[1]); E.linea([[26, 13], [30, 12.5], [34, 14]], HM[1]);
  } else { P.p(6, 2, HM[4]); P.p(10, 1, HM[4]); P.p(5, 3, HM[3]); P.p(9, 2, HM[3]); }
  if (n === 48) { for (const [x, y] of [[19, 5], [30, 3], [14, 8]]) P.p(x, y, HM[5]);
    for (const [x, y] of [[16, 29], [19, 33], [24, 34], [29, 33], [32, 29], [14, 31], [34, 31], [21, 36], [27, 36]]) P.sobre(x, y, BA[3], c => BA.includes(c));
    for (const [x, y] of [[15, 27], [33, 27], [18, 31], [30, 31], [22, 35], [26, 35]]) P.sobre(x, y, BA[1], c => BA.includes(c));
    P.p(10, 25, PIEL[1]); P.p(10, 26, PIEL[2]); P.p(37, 25, PIEL[1]); P.p(37, 26, PIEL[2]); }
  if (n === 32) { for (const [x, y] of [[10, 20], [13, 22], [16, 23], [19, 22], [21, 20]]) P.sobre(x, y, BA[3], c => BA.includes(c));
    for (const [x, y] of [[11, 22], [20, 22], [15, 24]]) P.sobre(x, y, BA[1], c => BA.includes(c)); }
}

/* ───────────────────────── ELLA ───────────────────────── */
function formaF(P, n) {
  const k = KESC[n], E = new Esc(P, k);
  E.poli([[5, 48], [6, 43], [11, 39.5], [18, 37.5], [30, 37.5], [37, 39.5], [42, 43], [43, 48]], CAM[3]);
  E.poli([[31, 38.5], [37, 40], [42, 44], [43, 48], [34, 48], [33, 43]], CAM[2]);
  E.poli([[5, 48], [6, 44], [10, 41.5], [12, 42.5], [10, 48]], CAM[4]);
  E.rect(20, 32, 8, 7, PIEL[2]); E.rect(20, 32, 8, 2, PIEL[1]);
  E.poli([[19, 38], [29, 38], [24, 44]], PIEL[2]);
  E.poli([[14, 37.5], [20, 37.5], [24, 44.5], [20, 45.5], [12, 41]], CAM[5]);
  E.poli([[34, 37.5], [28, 37.5], [24, 44.5], [28, 45.5], [36, 41]], CAM[4]);
  if (n >= 32) { E.linea([[20, 38], [24, 44]], CAM[2]); E.linea([[28, 38], [24, 44]], CAM[1]); }
  E.poli([[9, 22], [8, 14], [10, 9], [14, 5.5], [19, 3], [26, 2.5], [32, 4], [37, 8], [39.5, 14], [39, 22], [37, 26], [11, 26]], HF[2]);
  E.poli([[8.5, 21], [11, 24], [11.5, 31], [10, 37], [7.5, 35], [7, 27]], HF[2]);
  E.poli([[34, 24], [39, 26], [42.5, 32], [43, 40], [40.5, 45.5], [37.5, 41], [36.5, 33]], HF[2]);
  E.rect(35, 25, 4, 3, CLIP); if (n >= 32) { E.rect(35, 25, 4, 1, '#e6ecf8'); E.rect(36, 27, 3, 1, '#7f89a3'); }
  E.elipse(10.8, 24.5, 2, 2.8, PIEL[3]);
  E.poli([[11.5, 20], [13, 15], [18, 12], [24, 11.5], [30, 12], [35, 15], [36.5, 20], [36, 26], [33.5, 31.5], [29.5, 34.8], [24, 36], [18.5, 34.8], [14.5, 31.5], [12, 26]], PIEL[4]);
  sombraPiel(P, k, 24, 24, 12.5, 12, true);
  E.poli([[12, 23], [9.5, 17], [9.5, 11], [13, 6.5], [19, 3.5], [26, 2.5], [32, 4], [37, 8], [39.5, 14], [39, 21], [37, 26], [36.5, 20], [35, 16.2], [31, 14.2], [26.5, 13.2], [21.5, 12.6], [17, 13.8], [14, 16.5], [12.8, 20]], HF[2]);
  E.poli([[12.8, 20], [14, 16.5], [17, 13.8], [21.5, 12.6], [19, 16], [16, 19.5], [14, 24]], HF[2]);
  if (n >= 32) {
    E.linea([[12, 12], [15, 8], [20, 5.5], [26, 5]], HF[3]); E.linea([[14, 14], [17, 10], [22, 8], [28, 8]], HF[3]);
    E.linea([[27, 5.5], [32, 6.5], [36, 10]], HF[3]); E.linea([[30, 9], [34, 11], [37, 15]], HF[3]);
    E.linea([[15, 9], [19, 6.5], [24, 6]], HF[4]); E.linea([[28, 6.5], [32, 7.5]], HF[4]);
    E.linea([[10, 22], [9, 30]], HF[1]); E.linea([[8, 28], [9, 34]], HF[3]); E.linea([[39, 29], [41, 36]], HF[3]); E.linea([[40, 31], [40, 38]], HF[1]); E.linea([[12, 18], [13, 24]], HF[3]);
    E.linea([[17, 14], [20, 13.5], [22, 14]], HF[1]); E.linea([[27, 14], [31, 14], [35, 16]], HF[1]);
  } else { P.p(6, 2, HF[4]); P.p(10, 1, HF[4]); P.p(5, 3, HF[3]); }
  if (n === 48) { for (const [x, y] of [[20, 6], [31, 7], [14, 10]]) P.p(x, y, HF[5]); }
}

/** la luz viene de arriba a la izquierda: el lado derecho de la cara, un tono más oscuro */
function sombraPiel(P, k, cx, cy, rx, ry, barbilla = false) {
  for (let y = 0; y < P.h; y++) for (let x = 0; x < P.w; x++) if (P.get(x, y) === PIEL[4]) {
    const dx = ((x + .5) / k - cx) / rx, dy = ((y + .5) / k - cy) / ry;
    if (dx > .5 && dx * dx + dy * dy > .5) P.p(x, y, PIEL[3]);
    if (dx > .8 && k > .5) P.p(x, y, PIEL[2]);
    if (barbilla && dy > .8 && dx > -.2) P.p(x, y, PIEL[3]);
  }
}

/* ───────────────────────── RASGOS A MANO ───────────────────────── */
/* Ojos: cada fila es un mapa; K = párpado, I = iris/pupila, i = iris claro, W = blanco, h = brillo, S = mejilla.
   El ojo izquierdo se pinta tal cual y el derecho, espejado. */
const OJOS = {
  48: {
    normal: ['.KKKK.', 'WIhIIW', 'WIIIIW', '.WIIW.'], feliz: ['.KKKK.', 'WIhIIW', '.IIII.', '......'],
    enojado: ['KKKKKK', 'WIIIIW', '.WIIW.'], sorprendido: ['.KKKK.', 'KWWWWK', 'WWIIWW', 'WWIhWW', '.WWWW.'], preocupado: ['.KKKK.', 'WIhIIW', 'WIIIIW', '.WIIW.'],
  },
  32: {
    normal: ['.KK.', 'WIhW', 'WIIW', '.II.'], feliz: ['.KK.', 'WIhW', '.II.'],
    enojado: ['KKKK', 'WIIW', '.II.'], sorprendido: ['.KK.', 'WWWW', 'WIhW', '.II.'], preocupado: ['.KK.', 'WIhW', 'WIIW', '.II.'],
  },
  16: {
    normal: ['II', 'II'], feliz: ['II'], enojado: ['II', 'II'], sorprendido: ['WW', 'II', 'II'], preocupado: ['II', 'II'],
  },
};
/* Cejas del ojo izquierdo, relativas a su esquina; la derecha es el espejo. y = fila donde va la ceja. */
const CEJAS = {
  48: { normal: { y: 15, pts: [[2, 0], [3, 0], [4, 0], [5, 0], [0, 1], [1, 1], [2, 1], [3, 1], [6, 1]] }, feliz: { y: 14, pts: [[2, 0], [3, 0], [4, 0], [5, 0], [1, 1], [2, 1], [3, 1], [6, 1]] },
    enojado: { y: 14, pts: [[0, 0], [1, 0], [0, 1], [1, 1], [2, 1], [3, 1], [2, 2], [3, 2], [4, 2], [5, 2], [4, 3], [5, 3], [6, 3]] }, sorprendido: { y: 13, pts: [[2, 0], [3, 0], [4, 0], [5, 0], [1, 1], [6, 1]] },
    preocupado: { y: 14, pts: [[0, 2], [1, 2], [1, 1], [2, 1], [3, 1], [3, 0], [4, 0], [5, 0], [6, 0]] } },
  32: { normal: { y: 10, pts: [[1, 0], [2, 0], [3, 0], [4, 0]] }, feliz: { y: 9, pts: [[1, 1], [2, 0], [3, 0], [4, 0]] },
    enojado: { y: 9, pts: [[0, 0], [1, 0], [2, 1], [3, 1], [4, 2], [5, 2]] }, sorprendido: { y: 8, pts: [[1, 1], [2, 0], [3, 0], [4, 0]] },
    preocupado: { y: 10, pts: [[0, 1], [1, 1], [2, 0], [3, 0], [4, -1], [5, -1]] } },
  16: { normal: { y: 5, pts: [[0, 0], [1, 0], [2, 0]] }, feliz: { y: 4, pts: [[0, 1], [1, 0], [2, 0]] }, enojado: { y: 4, pts: [[0, 0], [1, 1], [2, 1]] },
    sorprendido: { y: 4, pts: [[0, 1], [1, 0], [2, 0]] }, preocupado: { y: 5, pts: [[0, 1], [1, 0], [2, -1]] } },
};
/* posición del ojo izquierdo (x, y) por tamaño; el derecho se coloca simétrico respecto al eje de la cara */
const POSOJO = { 48: { x: 16, y: 18, w: 6, eje: 24 }, 32: { x: 10, y: 12, w: 4, eje: 16 }, 16: { x: 5, y: 6, w: 2, eje: 8 } };

function ojos(P, sexo, n, e, blink) {
  const pos = POSOJO[n], ojoOscuro = sexo === 'm' ? OJO : OJOF, iris = sexo === 'm' ? IRIS : IRISF;
  let y0 = pos.y + (n === 48 ? (e === 'sorprendido' ? -1 : e === 'enojado' ? 1 : 0) : n === 32 ? (e === 'sorprendido' ? -1 : e === 'enojado' ? 1 : 0) : (e === 'sorprendido' ? -1 : 0));
  const dibuja = (x, izq) => {
    if (blink) {
      const yb = y0 + (n === 48 ? 3 : n === 32 ? 2 : 1);
      for (let i = 0; i < pos.w; i++) P.p(x + i, yb, ojoOscuro);
      if (n === 48 && sexo === 'f') P.p(izq ? x - 1 : x + pos.w, yb - 1, ojoOscuro);
      return;
    }
    const filas = OJOS[n][e], ancho = Math.max(...filas.map(f => f.length));
    filas.forEach((fila, j) => [...fila].forEach((ch, i) => {
      if (ch === '.') return;
      const xx = x + (izq || n === 16 ? i : ancho - 1 - i);
      const c = ch === 'K' ? ojoOscuro : ch === 'I' ? (n === 48 && (j === 2 || j === 3) ? iris : ojoOscuro) : ch === 'i' ? iris : ch === 'W' || ch === 'h' ? BLANCO : ch === 'S' ? PIEL[3] : null;
      if (c) P.p(xx, y0 + j, c);
    }));
    if (n === 48 && sexo === 'f') { P.p(izq ? x - 1 : x + pos.w, y0, ojoOscuro); }
    if (n === 48 && e === 'preocupado') { P.p(x + (izq ? 3 : 2), y0 + 1, BLANCO); P.p(x + (izq ? 2 : 3), y0 + 1, ojoOscuro); }
    if (n === 48 && e === 'feliz') for (const dx of [1, 2, 3, 4]) P.p(x + dx, y0 + 3, PIEL[3]);
    // En 32 px el párpado ya está en el mapa: no sumar una pestaña lateral que engorda el ojo.
  };
  const xi = pos.x, xd = 2 * pos.eje - pos.x - pos.w;
  dibuja(xi, true); dibuja(xd, false);
  /* cejas */
  const c = CEJAS[n][e], col = sexo === 'm' ? HM[1] : HF[1], eje = pos.eje;
  const x0 = n === 48 ? 15 : n === 32 ? 9 : 4;
  for (const [dx, dy] of c.pts) { P.p(x0 + dx, c.y + dy, col); P.p(2 * eje - 1 - (x0 + dx), c.y + dy, col); }
  if (n === 48) { if (sexo === 'm') { P.p(20, 15, HM[0]); P.p(27, 15, HM[0]); } }
}

function nariz(P, sexo, n) {
  if (n === 48) { if (sexo === 'm') { P.p(23, 23, PIEL[3]); P.p(24, 23, PIEL[3]); P.rect(23, 24, 3, 1, PIEL[2]); P.p(24, 22, PIEL[5]); } else { P.p(24, 24, PIEL[2]); P.p(23, 24, PIEL[3]); P.p(25, 24, PIEL[3]); P.p(24, 22, PIEL[5]); P.p(24, 23, PIEL[3]); } }
  if (n === 32) { P.p(15, 16, PIEL[3]); P.p(16, 16, PIEL[2]); }
}

/* Bocas: cada tamaño y gesto con su propio dibujo (L = labio, B = interior, D = dientes, T = lengua) */
function boca(P, sexo, n, e) {
  const L = sexo === 'm' ? LABIOM : LABIO1, L2 = sexo === 'm' ? LABIOM : LABIO2, B = sexo === 'm' ? BOCAM : BOCAF, T = LENGUA, D = BLANCO;
  if (n === 48 && sexo === 'm') {
    P.poli([[17.5, 27.5], [21, 26], [24, 27], [27, 26], [30.5, 27.5], [29, 29.2], [24, 28.4], [19, 29.2]], BA[0]);
    if (e === 'normal') { P.rect(22, 29, 5, 1, L); P.rect(22, 30, 5, 1, B); P.p(21, 29, B); P.p(27, 29, B); }
    if (e === 'feliz') { P.rect(21, 29, 7, 1, D); P.rect(21, 30, 7, 2, B); P.rect(23, 31, 3, 1, T); P.p(20, 29, B); P.p(28, 29, B); }
    if (e === 'enojado') { P.rect(22, 30, 5, 1, B); P.p(21, 31, B); P.p(27, 31, B); P.rect(23, 29, 3, 1, L); }
    if (e === 'sorprendido') { P.rect(23, 29, 3, 3, B); P.p(22, 30, B); P.p(26, 30, B); P.p(24, 30, L); P.p(23, 29, L); P.p(25, 29, L); }
    if (e === 'preocupado') { for (const [x, y] of [[21, 31], [22, 30], [23, 30], [24, 31], [25, 30], [26, 30], [27, 31]]) P.p(x, y, B); P.rect(22, 29, 5, 1, L); }
  }
  if (n === 48 && sexo === 'f') {
    if (e === 'normal') { P.rect(22, 29, 5, 1, L); P.rect(23, 30, 3, 1, L2); P.p(21, 28, PIEL[1]); P.p(27, 28, PIEL[1]); P.p(21, 29, L); P.p(27, 29, L); }
    if (e === 'feliz') { P.rect(21, 28, 7, 1, L); P.rect(22, 29, 5, 1, D); P.rect(22, 30, 5, 2, B); P.rect(23, 31, 3, 1, T); P.p(20, 28, PIEL[1]); P.p(28, 28, PIEL[1]); P.rect(22, 32, 5, 1, L2); }
    if (e === 'enojado') { P.rect(22, 30, 5, 1, B); P.p(21, 31, B); P.p(27, 31, B); P.rect(23, 29, 3, 1, L); }
    if (e === 'sorprendido') { P.rect(23, 29, 3, 3, B); P.p(22, 30, L); P.p(26, 30, L); P.p(24, 28, L); P.p(24, 32, L2); P.p(23, 29, L); P.p(25, 29, L); }
    if (e === 'preocupado') { for (const [x, y] of [[21, 31], [22, 30], [23, 30], [24, 31], [25, 30], [26, 30], [27, 31]]) P.p(x, y, L); P.rect(23, 29, 3, 1, L2); }
  }
  if (n === 32) {
    if (sexo === 'm') P.poli([[17.5 * 2 / 3, 27.5 * 2 / 3], [21 * 2 / 3, 26 * 2 / 3], [24 * 2 / 3, 27 * 2 / 3], [27 * 2 / 3, 26 * 2 / 3], [30.5 * 2 / 3, 27.5 * 2 / 3], [29 * 2 / 3, 29.2 * 2 / 3], [24 * 2 / 3, 28.4 * 2 / 3], [19 * 2 / 3, 29.2 * 2 / 3]], BA[0]);
    const y = sexo === 'm' ? 19 : 20;
    if (e === 'normal') { P.rect(14, y, 4, 1, B); P.rect(15, y + 1, 2, 1, L); }
    if (e === 'feliz') { P.rect(14, y, 4, 1, D); P.rect(13, y + 1, 6, 1, B); P.p(15, y + 1, T); P.p(16, y + 1, T); }
    if (e === 'enojado') { P.rect(14, y + 1, 4, 1, B); P.p(13, y + 2, B); P.p(18, y + 2, B); }
    if (e === 'sorprendido') { P.rect(14, y, 4, 3, B); P.p(14, y, L); P.p(17, y, L); }
    if (e === 'preocupado') { P.rect(14, y, 4, 1, L); for (const [x, yy] of [[13, y + 2], [14, y + 1], [15, y + 1], [16, y + 2], [17, y + 1], [18, y + 1]]) P.p(x, yy, B); }
  }
  if (n === 16) {
    if (sexo === 'm') P.rect(6, 9, 4, 1, BA[0]);
    const y = sexo === 'm' ? 10 : 10;
    if (e === 'normal') { P.rect(7, y, 2, 1, L); P.p(6, y, sexo === 'm' ? B : PIEL[1]); P.p(9, y, sexo === 'm' ? B : PIEL[1]); }
    if (e === 'feliz') { P.rect(6, y, 4, 1, D); P.rect(7, y + 1, 2, 1, B); }
    if (e === 'enojado') { P.rect(7, y + 1, 2, 1, B); P.rect(7, y, 2, 1, L); }
    if (e === 'sorprendido') { P.rect(7, y, 2, 2, B); }
    if (e === 'preocupado') { P.p(6, y + 1, B); P.rect(7, y, 2, 1, B); P.p(9, y + 1, B); }
  }
}

/* ───────────────────────── 16×16: la cabeza entera, a mano ─────────────────────────
   Escalar los polígonos de 48 a 16 dejaba solo 3 filas de piel justo donde van los ojos. A 16×16 la cabeza
   se dibuja entera, píxel a píxel, para cada personaje; los hombros salen de la forma común. */
const c16 = s => { const f = s.padStart(Math.floor((16 + s.length) / 2), '.').padEnd(16, '.'); if (f.length !== 16) throw new Error('fila de 16: ' + s); return f; };
const CABEZA16 = {
  m: ['hhhhhhhh', 'hhhlhhhhhh', 'hhhhhlhhhhhh', 'hhhhhhhhhhhh', 'hhssssssssss'.replace('hhssssssssss', 'hhssssssssh h'.replace(' ', '')),
    'hss##ss##ssh', 'hss##ss##ssh', 'ussssttssssu', 'ubbddddddbbu', 'bbbbbllbbbbb', 'bbbbbbbbbb', 'bbbbbbbb'],
  f: ['ffffffff', 'fffgffffff', 'fffffgffffff', 'ffffffffffff', 'ffssssssssff',
    'fss##ss##ssf', 'fss##ss##ssf', 'fssssttssssf', 'fssssllssssf', 'ffssssssssff', 'fffssssssfff', 'fffuuuufff'],
};
function retrato16(sexo, e, blink) {
  const P = new Lienzo(16, 16);
  (sexo === 'm' ? formaM : formaF)(P, 16);
  for (let y = 0; y <= 12; y++) for (let x = 0; x < 16; x++) P.p(x, y, null);        // se borra la cabeza escalada; quedan los hombros
  const LEY = sexo === 'm'
    ? { h: HM[2], l: HM[3], H: HM[1], s: PIEL[4], t: PIEL[3], u: PIEL[2], b: BA[2], d: BA[0], '#': OJO, L: LABIOM, B: BOCAM, W: BLANCO }
    : { f: HF[2], g: HF[3], s: PIEL[4], t: PIEL[3], u: PIEL[2], '#': OJOF, L: LABIO1, l: LABIO2, B: BOCAF, W: BLANCO };
  CABEZA16[sexo].forEach((fila, j) => P.mapa(0, j + 1, [c16(fila)], LEY));
  const ojo = sexo === 'm' ? OJO : OJOF, piel = PIEL[4], boca = sexo === 'm' ? { y: 10, lab: LABIOM, hondo: BOCAM } : { y: 9, lab: LABIO2, hondo: BOCAF };
  const cejas = sexo === 'm' ? HM[1] : HF[1];
  const quitaOjos = filas => { for (const y of filas) for (const x of [5, 6, 9, 10]) P.p(x, y, piel); };
  /* ojos: el parpadeo deja solo la fila de abajo; feliz, solo la de arriba (arcos) */
  if (blink) quitaOjos([7 - 1 + 0]);                       // y = 6 vuelve a piel: queda la fila 7
  if (!blink && e === 'feliz') quitaOjos([7]);
  if (!blink && e === 'sorprendido') for (const x of [5, 6, 9, 10]) P.p(x, 5, BLANCO);
  /* cejas (en normal y feliz no hay: a 16 se funden con el pelo) */
  if (e === 'enojado') { for (const [x, y] of [[4, 5], [5, 5], [6, 6], [11, 5], [10, 5], [9, 6]]) P.p(x, y, cejas); }
  if (e === 'preocupado') { for (const [x, y] of [[4, 6], [5, 5], [6, 5], [11, 6], [10, 5], [9, 5]]) P.p(x, y, cejas); }
  /* boca */
  const y = boca.y;
  if (e === 'feliz') { for (const x of [6, 7, 8, 9]) P.p(x, y, BLANCO); P.p(7, y + 1, boca.hondo); P.p(8, y + 1, boca.hondo); }
  if (e === 'enojado') { for (const x of [7, 8]) P.p(x, y, boca.hondo); if (sexo === 'm') for (const x of [7, 8]) P.p(x, y, boca.hondo); }
  if (e === 'sorprendido') { for (const x of [7, 8]) { P.p(x, y, boca.hondo); P.p(x, y + 1, boca.hondo); } }
  if (e === 'preocupado') { for (const x of [7, 8]) P.p(x, y, boca.lab); P.p(6, y, boca.hondo); P.p(9, y, boca.hondo); }
  if (sexo === 'f') { P.p(13, 9, CLIP); P.p(13, 10, CLIP); for (const [x, yy] of [[13, 11], [14, 11], [13, 12], [14, 12], [13, 13]]) P.p(x, yy, HF[2]); }
  const peloOscuro = sexo === 'm' ? '#120b09' : '#1a0d09', esPelo = sexo === 'm' ? esPeloM : esPeloF;
  P.contorno(v => esPelo(v) ? peloOscuro : esPiel(v) ? (sexo === 'm' ? '#4a2517' : '#6a3a2a') : v === CLIP ? '#4a5470' : '#0a1228');
  return P;
}

/* ───────────────────────── MONTAJE ───────────────────────── */
export function retrato(sexo, n, e, blink) {
  if (n === 16) return retrato16(sexo, e, blink);
  const P = new Lienzo(n, n);
  (sexo === 'm' ? formaM : formaF)(P, n);
  ojos(P, sexo, n, e, blink); nariz(P, sexo, n); boca(P, sexo, n, e);
  const peloOscuro = sexo === 'm' ? '#120b09' : '#1a0d09', esPelo = sexo === 'm' ? esPeloM : esPeloF;
  P.contorno(v => esPelo(v) ? peloOscuro : esPiel(v) ? (sexo === 'm' ? '#4a2517' : '#6a3a2a') : v === CLIP ? '#4a5470' : '#0a1228');
  return P;
}

/** retrato con accesorios, para revisarlo (en el juego lo compone js/retratos-aprendiz.js con los mismos datos) */
export function componer(sexo, n, e, blink, ids = []) {
  const nombre = sexo === 'm' ? 'masculina' : 'femenina', L = new Lienzo(n, n);
  for (const id of ids) { const { detras } = accesorio(id, nombre, n); L.pega(detras); }
  L.pega(retrato(sexo, n, e, blink));
  for (const id of ids) { const { encima } = accesorio(id, nombre, n); L.pega(encima); }
  return L;
}

/* ───────────────────────── SALIDA ───────────────────────── */
function datos() {
  const paleta = [['#000000', 0]], idx = new Map();
  const rol = c => PIEL.includes(c) ? 1 : CAM.includes(c) ? 2 : 0;
  const frames = { masculina: {}, femenina: {} };
  for (const [sx, nombre] of [['m', 'masculina'], ['f', 'femenina']]) for (const n of TAMANOS) { frames[nombre][n] = {};
    for (const e of GESTOS) for (const blink of [false, true]) {
      const P = retrato(sx, n, e, blink), rle = []; let corrida = 0, ult = -1;
      for (const c of P.d) { let i = 0; if (c) { if (!idx.has(c)) { idx.set(c, paleta.length); paleta.push([c, rol(c)]); } i = idx.get(c); }
        if (i === ult) corrida++; else { if (corrida) rle.push(corrida, ult); ult = i; corrida = 1; } }
      rle.push(corrida, ult); frames[nombre][n][e + (blink ? '-blink' : '')] = rle; } }
  const codifica = P => { const rle = []; let corrida = 0, ult = -1;
    for (const c of P.d) { let i = 0; if (c) { if (!idx.has(c)) { idx.set(c, paleta.length); paleta.push([c, rol(c)]); } i = idx.get(c); }
      if (i === ult) corrida++; else { if (corrida) rle.push(corrida, ult); ult = i; corrida = 1; } }
    rle.push(corrida, ult); return rle; };
  const vacio = P => P.d.every(c => !c);
  const acc = {};
  for (const id of ACC_IDS) { acc[id] = {};
    for (const nombre of ['masculina', 'femenina']) { acc[id][nombre] = {};
      for (const n of TAMANOS) { const { detras, encima } = accesorio(id, nombre, n); acc[id][nombre][n] = { e: codifica(encima) }; if (!vacio(detras)) acc[id][nombre][n].d = codifica(detras); } } }
  return { paleta, frames, acc };
}
/** el texto exacto de js/retratos-aprendiz-arte.js (la prueba comprueba que el archivo del juego coincide con sus fuentes) */
export function generaJS() {
  const { paleta, frames, acc } = datos();
  return { paleta, js: `// Generado por scripts/build-retratos-protagonistas.mjs. No editar a mano.
/* Retratos de los dos protagonistas, dibujados a mano para cada tamaño (16, 32 y 48).
   frames[apariencia][tamaño][gesto] y [gesto + '-blink']: lista [repeticiones, color, …] de n×n píxeles;
   acc[accesorio][apariencia][tamaño] = {e: capa de encima, d: capa de detrás (solo la capa)} con el mismo formato;
   el color 0 es transparente. palette[i] = [hex, rol]: rol 1 = piel y 2 = camisa se recolorean; 0 no. */
const ARTE_RETRATOS_APRENDIZ=${JSON.stringify({ version: 2, tamanos: TAMANOS, gestos: GESTOS, palette: paleta, frames, acc })};
` };
}
function escribe() {
  const { paleta, js } = generaJS();
  writeFileSync(join(RAIZ, 'js/retratos-aprendiz-arte.js'), js);
  const dir = join(RAIZ, 'arte/retratos-protagonistas'); mkdirSync(dir, { recursive: true });
  for (const [sx, nombre] of [['m', 'masculina'], ['f', 'femenina']]) {
    const por = (n, blink) => GESTOS.map(g => retrato(sx, n, g, blink));
    const esc = { 16: 10, 32: 5, 48: 4 };
    for (const n of TAMANOS) { const h = hoja([...por(n, false), ...por(n, true)], { cols: 5, esc: esc[n] }); writeFileSync(join(dir, `${nombre}-${n}.png`), codificarPNG(h.w, h.h, h.rgba)); }
  }
  for (const [sx, nombre] of [['m', 'masculina'], ['f', 'femenina']]) {
    const lienzos = []; for (const n of TAMANOS) for (const id of ACC_IDS) lienzos.push(componer(sx, n, 'normal', false, [id]));
    const h = hoja(lienzos, { cols: ACC_IDS.length, esc: 4 }); writeFileSync(join(dir, `${nombre}-accesorios.png`), codificarPNG(h.w, h.h, h.rgba));
  }
  return { colores: paleta.length, bytes: js.length };
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) { const r = escribe(); console.log(`ok: ${r.colores} colores, ${(r.bytes / 1024).toFixed(0)} KB`); }
